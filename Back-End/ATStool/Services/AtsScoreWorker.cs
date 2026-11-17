using System.Text.Json;
using System.Threading.Channels;
using ATStool.Data;
using ATStool.DTOs.Candidates;
using ATStool.Queue;
using Microsoft.EntityFrameworkCore;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    /// <summary>
    /// BackgroundService that drains the AtsScoreJob Channel in chunks of 50.
    ///
    /// Flow per chunk:
    ///   1. Mark all applications ATSscore = -1  (in-flight)
    ///   2. POST /score-candidates to Python with all 50
    ///   3a. Success → save scores, requeue nulls with RetryCount++, mark -2 if exhausted
    ///   3b. Exception → reset to null, requeue or mark -2
    ///   4. Push SSE update for all candidates touched in this chunk
    /// </summary>
    public class AtsScoreWorker : BackgroundService
    {
        private const int ChunkSize = 50;

        // ATSscore sentinels: null = unscored, -1 = in flight, -2 = failed, -3 = needs review
        // (the AI service flagged a possible prompt injection, so no score is stored).
        private const double NeedsReviewScore = -3;

        private readonly Channel<AtsScoreJob> _channel;
        private readonly ISseService _sseService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AtsScoreWorker> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public AtsScoreWorker(
            Channel<AtsScoreJob> channel,
            ISseService sseService,
            IServiceScopeFactory scopeFactory,
            IHttpClientFactory httpClientFactory,
            ILogger<AtsScoreWorker> logger)
        {
            _channel = channel;
            _sseService = sseService;
            _scopeFactory = scopeFactory;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var buffer = new List<AtsScoreJob>(ChunkSize);

            await foreach (var job in _channel.Reader.ReadAllAsync(stoppingToken))
            {
                buffer.Add(job);

                bool channelDrained = _channel.Reader.Count == 0;
                if (buffer.Count < ChunkSize && !channelDrained)
                    continue;

                var chunk = new List<AtsScoreJob>(buffer);
                buffer.Clear();

                // C-1 FIX: attach a continuation to log any unhandled exception that
                // escapes ProcessChunkAsync (e.g. before its internal try/catch).
                // Without this, a thrown exception is silently swallowed and the entire
                // chunk of scoring jobs is lost with no log, no retry, no state reset.
                _ = ProcessChunkAsync(chunk, stoppingToken)
                        .ContinueWith(
                            t => _logger.LogError(t.Exception,
                                "AtsScoreWorker: unhandled exception in ProcessChunkAsync"),
                            CancellationToken.None,
                            TaskContinuationOptions.OnlyOnFaulted,
                            TaskScheduler.Default);
            }
        }

        // After — group by JobId, handle each group independently
        private async Task ProcessChunkAsync(List<AtsScoreJob> chunk, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var candidateIds = chunk.Select(j => j.CandidateId).ToList();
            var jobIds = chunk.Select(j => j.JobId).Distinct().ToList();

            // Mark all in-flight across all jobIds in chunk
            await db.Applications
                .Where(a => jobIds.Contains(a.JobId) && candidateIds.Contains(a.CandidateId))
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.ATSscore, -1.0), ct);

            List<PythonScoreResult>? pythonResults = null;
            Exception? callException = null;

            try
            {
                var httpClient = _httpClientFactory.CreateClient("AtsScoreClient");

                var payload = new
                {
                    jdContent = chunk[0].JdContent,
                    candidates = chunk.Select(j => new
                    {
                        candidateId = j.CandidateId,
                        resumeContent = j.ResumeContent
                    }).ToList()
                };

                var response = await httpClient.PostAsJsonAsync("/score-candidates", payload, ct);
                response.EnsureSuccessStatusCode();

                pythonResults = await response.Content
                    .ReadFromJsonAsync<List<PythonScoreResult>>(_jsonOptions, ct);
            }
            catch (Exception ex)
            {
                callException = ex;
                _logger.LogError(ex, "AtsScoreWorker: Python call failed for jobIds={JobIds}",
                    string.Join(",", jobIds));
            }

            List<string> touchedCandidateIds;

            if (callException != null)
                touchedCandidateIds = await HandleCallFailureAsync(db, chunk, ct);
            else
                touchedCandidateIds = await HandleResultsAsync(db, chunk, pythonResults ?? [], ct);

            // Push SSE per jobId so each frontend subscription gets the right update
            foreach (var jobId in jobIds)
            {
                var jobCandidateIds = chunk
                    .Where(j => j.JobId == jobId)
                    .Select(j => j.CandidateId)
                    .ToList();

                await PushSseAsync(db, jobId, jobCandidateIds, ct);
            }
        }
        private async Task<List<string>> HandleResultsAsync(AppDbContext db,List<AtsScoreJob> chunk,List<PythonScoreResult> pythonResults,CancellationToken ct)
        {
            var resultMap = pythonResults
                .Where(r => r.Status == "success" && r.ATSScore.HasValue)
                .ToDictionary(r => r.CandidateId, r => r.ATSScore!.Value);

            // Suspected prompt injection: no score is trusted and a retry would be flagged again.
            var flagged = pythonResults
                .Where(r => r.Status == "flagged")
                .Select(r => r.CandidateId)
                .ToHashSet();

            // Batch-fetch all applications for the entire chunk in one query
            var candidateIds = chunk.Select(j => j.CandidateId).ToList();
            var jobIds = chunk.Select(j => j.JobId).ToList();

            var applications = await db.Applications
                .Where(a => candidateIds.Contains(a.CandidateId) && jobIds.Contains(a.JobId))
                .ToListAsync(ct);

            // Build lookup dictionary — O(1) per access inside the loop
            var appLookup = applications
                .ToDictionary(a => (a.CandidateId, a.JobId));

            var touchedCandidateIds = new List<string>();

            foreach (var job in chunk)
            {
                touchedCandidateIds.Add(job.CandidateId);

                // No DB call — dictionary lookup
                if (!appLookup.TryGetValue((job.CandidateId, job.JobId), out var app))
                    continue;

                if (resultMap.TryGetValue(job.CandidateId, out var score))
                {
                    app.ATSscore = score;
                }
                else if (flagged.Contains(job.CandidateId))
                {
                    app.ATSscore = NeedsReviewScore;
                }
                else if (job.RetryCount < AtsScoreJob.MaxRetries)
                {
                    app.ATSscore = null;
                    var retryJob = job with { RetryCount = job.RetryCount + 1 };
                    await _channel.Writer.WriteAsync(retryJob, ct);
                }
                else
                {
                    app.ATSscore = -2;
                }
            }

            await db.SaveChangesAsync(ct);
            return touchedCandidateIds;
        }

        private async Task<List<string>> HandleCallFailureAsync(
    AppDbContext db,
    List<AtsScoreJob> chunk,
    CancellationToken ct)
        {
            var candidateIds = chunk.Select(j => j.CandidateId).ToList();
            var jobIds = chunk.Select(j => j.JobId).ToList();

            var applications = await db.Applications
                .Where(a => candidateIds.Contains(a.CandidateId) && jobIds.Contains(a.JobId))
                .ToListAsync(ct);

            var appLookup = applications.ToDictionary(a => (a.CandidateId, a.JobId));
            var touchedCandidateIds = new List<string>();

            foreach (var job in chunk)
            {
                touchedCandidateIds.Add(job.CandidateId);

                if (!appLookup.TryGetValue((job.CandidateId, job.JobId), out var app))
                    continue;

                if (job.RetryCount < AtsScoreJob.MaxRetries)
                {
                    app.ATSscore = null;
                    var retryJob = job with { RetryCount = job.RetryCount + 1 };
                    await _channel.Writer.WriteAsync(retryJob, ct);
                }
                else
                {
                    app.ATSscore = -2;
                }
            }

            await db.SaveChangesAsync(ct);
            return touchedCandidateIds;
        }

        private async Task PushSseAsync(
            AppDbContext db,
            string jobId,
            List<string> candidateIds,
            CancellationToken ct)
        {
            if (candidateIds.Count == 0) return;

            var rows = await db.Applications
                .Where(a => a.JobId == jobId && candidateIds.Contains(a.CandidateId))
                .Join(db.Candidates,
                    a => a.CandidateId,
                    c => c.CandidateId,
                    (a, c) => new { a, c })
                .ToListAsync(ct);

            var candidates = rows.Select(x => new CandidateResponse
            {
                Id = x.c.CandidateId,
                Name = x.c.Name,
                Email = x.c.Email,
                Phone = x.c.Phone,
                LinkedIn = x.c.LinkedIn,
                GitHub = x.c.GitHub,
                AvatarUrl = x.c.AvatarUrl,
                Skills = x.c.Skills?.Any() == true ? x.c.Skills : null,
                Experience = x.c.Experience,
                Education = x.c.Education,
                // null / -1 / -2 all surface as-is; frontend maps them to UI states
                MatchScore = x.a.ATSscore.HasValue ? (int?)x.a.ATSscore.Value : null,
                Status = x.a.Status,
                AppliedDate = x.c.AppliedDate.ToString("dd-MM-yyyy"),
                AppliedJob = null
            }).ToList();

            await _sseService.PushCandidatesAsync(jobId, candidates);
        }

        private sealed record PythonScoreResult(
            string CandidateId,
            double? ATSScore,
            string Status);
    }
}