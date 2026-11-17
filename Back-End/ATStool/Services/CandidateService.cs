using Microsoft.EntityFrameworkCore;
using ATStool.Data;
using ATStool.DTOs.Candidates;
using ATStool.Exceptions;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class CandidateService : ICandidateService
    {
        private static readonly string[] StageOrder =
        [
            "under_review", "filtered", "shortlisted", "interviewing", "selected"
        ];

        private readonly AppDbContext _context;
        private readonly IBlobService _blobService;
        private readonly IDbContextFactory<AppDbContext> _contextFactory;

        public CandidateService(AppDbContext context, IBlobService blobService, IDbContextFactory<AppDbContext> contextFactory)
        {
            _context = context;
            _blobService = blobService;
            _contextFactory = contextFactory;
        }

        public async Task<CandidateListResponse> GetCandidatesAsync(
            int page, int limit, string? status, string? search, string? jobId,
            string? sortBy = null, string? sortDir = null, int? minScore = null)
        {
            var appQuery = _context.Applications
                .AsNoTracking()
                .Join(_context.Jobs,
                      a => a.JobId,
                      j => j.Id.ToString(),
                      (a, j) => new { a, j })
                .Join(_context.Candidates,
                 aj => aj.a.CandidateId,
                 c => c.CandidateId,
                 (aj, c) => new { aj.a, aj.j, c });

            if (!string.IsNullOrEmpty(jobId))
                appQuery = appQuery.Where(x => x.a.JobId == jobId);

            if (!string.IsNullOrEmpty(status))
                appQuery = appQuery.Where(x => x.a.Status == status);

            // ATS Top Picks: server-side minScore filter
            if (minScore.HasValue)
                appQuery = appQuery.Where(x => x.a.ATSscore >= minScore.Value);

            // Search in SQL — avoids loading all rows into memory
            if (!string.IsNullOrEmpty(search))
            {
                var term = search.Trim().ToLower();
                appQuery = appQuery.Where(x => x.c.Name.ToLower().Contains(term));
            }

            var total = await appQuery.CountAsync();

            // Configurable sort; default is matchScore desc
            var desc = string.IsNullOrEmpty(sortDir) || sortDir == "desc";
            var paged = await (sortBy switch
            {
                "name"        => desc
                                    ? appQuery.OrderByDescending(x => x.c.Name)
                                    : appQuery.OrderBy(x => x.c.Name),
                "appliedDate" => desc
                                    ? appQuery.OrderByDescending(x => x.c.AppliedDate)
                                    : appQuery.OrderBy(x => x.c.AppliedDate),
                _             => appQuery
                                    .OrderByDescending(x => x.a.ATSscore >= 0 ? x.a.ATSscore : null)
                                    .ThenByDescending(x => x.c.AppliedDate),
            })
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

            // Current round per (candidate, job) for candidates being interviewed —
            // the name of the highest-numbered booked round.
            var pagedCandidateIds = paged.Select(x => x.c.CandidateId).Distinct().ToList();
            var bookedInterviews = await _context.Interviews
                .AsNoTracking()
                .Where(i => pagedCandidateIds.Contains(i.CandidateId)
                            && (i.Status == "Scheduled" || i.Status == "Completed"))
                .Select(i => new { i.CandidateId, i.JobId, i.InterviewRound, i.RoundName })
                .ToListAsync();

            // Key by JobId.ToString() in memory — SQL's CONVERT renders GUIDs uppercase,
            // but Application.JobId is stored lowercase, so do the conversion client-side.
            var currentRoundByKey = bookedInterviews
                .GroupBy(i => (i.CandidateId, JobId: i.JobId.ToString()))
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var top = g.OrderByDescending(i => i.InterviewRound).First();
                        return string.IsNullOrWhiteSpace(top.RoundName) ? $"Round {top.InterviewRound}" : top.RoundName;
                    });

            return new CandidateListResponse
            {
                Total = total,
                Page = page,
                Limit = limit,
                Candidates = paged.Select(x => new CandidateResponse
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
                    // Sentinels (-1 pending, -2 failed, -3 needs review) pass through, same as the SSE push
                    MatchScore = x.a.ATSscore.HasValue ? (int?)x.a.ATSscore.Value : null,
                    // ✅ Status always from Applications
                    Status = x.a.Status,
                    CurrentRound = x.a.Status == "interviewing"
                        ? currentRoundByKey.GetValueOrDefault((x.c.CandidateId, x.a.JobId))
                        : null,
                    // ✅ AppliedJob always populated from the join
                    AppliedJob = new AppliedJobDto
                    {
                        Id = x.j.Id.ToString(),
                        Title = x.j.JobTitle
                    },
                    AppliedDate = x.c.AppliedDate.ToString("dd-MM-yyyy")
                }).ToList()
            };
        }

        public async Task<CandidateDetailResponse> GetCandidateDetailAsync(
            string candidateId,
            string jobId,
            bool includeJobDescription = true)
        {
            var jobGuid = Guid.Parse(jobId);

            // JD blob is derived from jobId alone — start it at t=0, no DB deps
            var jdTask = includeJobDescription
                ? FetchSafeAsync(() => _blobService.DownloadJobDescriptionAsync($"drafts/{jobId}.pdf"))
                : Task.FromResult<byte[]?>(null);

            // Batch 1: all 4 DB queries are independent — run in parallel
            await using var ctx1 = _contextFactory.CreateDbContext();
            await using var ctx2 = _contextFactory.CreateDbContext();
            await using var ctx3 = _contextFactory.CreateDbContext();
            await using var ctx4 = _contextFactory.CreateDbContext();

            var candidateTask = ctx1.Candidates.FindAsync(candidateId).AsTask();
            var applicationTask = ctx2.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId);
            var jobTask = ctx3.Jobs
                .FirstOrDefaultAsync(j => j.Id == jobGuid);
            var appCountTask = ctx4.Applications
                .CountAsync(a => a.CandidateId == candidateId);

            await Task.WhenAll(candidateTask, applicationTask, jobTask, appCountTask);

            var candidate = candidateTask.Result
                ?? throw new NotFoundException($"Candidate {candidateId} not found.");
            var application = applicationTask.Result
                ?? throw new NotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");
            var job = jobTask.Result;
            var applicationCount = appCountTask.Result;

            // Batch 2: resume blob + conditional interview query — both run while jdTask is still in-flight
            var resumeTask = FetchSafeAsync(() =>
                _blobService.DownloadProcessedResumeAsync(application.BlobId.Replace("processed-resumes/", "")));
            var interviewTask = application.Status == "interviewing"
                ? FetchLatestInterviewRoundAsync(candidateId, jobGuid)
                : Task.FromResult<(int Round, string? Name)?>(null);

            await Task.WhenAll(resumeTask, interviewTask, jdTask);

            var latestInterview = interviewTask.Result;
            string? currentRound = null;
            if (latestInterview.HasValue)
                currentRound = string.IsNullOrWhiteSpace(latestInterview.Value.Name)
                    ? $"Round {latestInterview.Value.Round}"
                    : latestInterview.Value.Name;

            return new CandidateDetailResponse
            {
                Id = candidate.CandidateId,
                Name = candidate.Name,
                CurrentRole = job?.JobTitle,
                AvatarUrl = candidate.AvatarUrl,
                MatchScore = application.ATSscore.HasValue ? (int?)application.ATSscore.Value : null, // sentinels pass through
                IsDuplicate = applicationCount > 1,
                AppliedJob = job != null ? new AppliedJobDto
                {
                    Id = job.Id.ToString(),
                    Title = job.JobTitle
                } : null,
                ApplicationSource = "Direct Upload",
                Status = application.Status,
                CurrentRound = currentRound,
                AppliedDate = candidate.AppliedDate.ToString("yyyy-MM-dd"),
                Email = candidate.Email,
                Phone = candidate.Phone,
                LinkedIn = candidate.LinkedIn,
                GitHub = candidate.GitHub,
                Skills = candidate.Skills?.Any() == true ? candidate.Skills : null,
                Experience = candidate.Experience,
                Education = candidate.Education,
                SkippedRounds = application.SkippedRounds.Select(s => s.Round).OrderBy(r => r).ToList(),
                ResumeBase64 = IsValidPdf(resumeTask.Result) ? Convert.ToBase64String(resumeTask.Result!) : null,
                ResumeFileName = Path.GetFileName(application.BlobId),
                JobDescBase64 = IsValidPdf(jdTask.Result) ? Convert.ToBase64String(jdTask.Result!) : null,
                JobDescFileName = $"{job?.JobTitle}.pdf"
            };
        }

        private static bool IsValidPdf(byte[]? bytes) =>
            bytes?.Length > 4 && bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46;

        private async Task<byte[]?> FetchSafeAsync(Func<Task<byte[]>> fetchFunc)
        {
            try
            {
                return await fetchFunc();
            }
            catch (NotFoundException)
            {
                return null;
            }
        }

        private async Task<(int Round, string? Name)?> FetchLatestInterviewRoundAsync(string candidateId, Guid jobGuid)
        {
            await using var ctx = _contextFactory.CreateDbContext();
            var latest = await ctx.Interviews
                .AsNoTracking()
                .Where(i => i.CandidateId == candidateId && i.JobId == jobGuid
                            && (i.Status == "Scheduled" || i.Status == "Completed"))
                .OrderByDescending(i => i.InterviewRound)
                .Select(i => new { i.InterviewRound, i.RoundName })
                .FirstOrDefaultAsync();
            return latest != null ? (latest.InterviewRound, latest.RoundName) : null;
        }




        // ✅ string candidateId — matches model and interface
        public async Task<string> MoveToNextStageAsync(string candidateId, string jobId)
        {
            var application = await _context.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId)
                ?? throw new NotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");

            var currentIndex = Array.IndexOf(StageOrder, application.Status);
            if (currentIndex >= 0 && currentIndex < StageOrder.Length - 1)
                application.Status = StageOrder[currentIndex + 1];

            await _context.SaveChangesAsync();
            return application.Status ?? string.Empty;
        }

        public async Task<string> MoveToPreviousStageAsync(string candidateId, string jobId)
        {
            var application = await _context.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId)
                ?? throw new NotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");

            if (application.Status == "interviewing")
            {
                var jobGuid = Guid.Parse(jobId);
                var interviews = await _context.Interviews
                    .Where(i => i.CandidateId == candidateId && i.JobId == jobGuid)
                    .ToListAsync();
                _context.Interviews.RemoveRange(interviews);
                application.SkippedRounds.Clear();
            }

            if (application.Status == "rejected")
            {
                application.Status = "under_review";
            }
            else
            {
                var currentIndex = Array.IndexOf(StageOrder, application.Status);
                if (currentIndex > 0)
                    application.Status = StageOrder[currentIndex - 1];
            }

            await _context.SaveChangesAsync();
            return application.Status ?? string.Empty;
        }

        public async Task<string> ShortlistAsync(string candidateId, string jobId)
        {
            var application = await _context.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId)
                ?? throw new NotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");

            application.Status = "shortlisted";
            await _context.SaveChangesAsync();
            return application.Status;
        }

        public async Task<string> RejectAsync(string candidateId, string jobId)
        {
            var application = await _context.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId)
                ?? throw new NotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");

            application.Status = "rejected";
            await _context.SaveChangesAsync();
            return application.Status;
        }

        public async Task AssignInterviewersAsync(string candidateId, List<string> interviewerIds)
        {
            var candidate = await _context.Candidates.FindAsync(candidateId)
                ?? throw new NotFoundException($"Candidate {candidateId} not found.");

            candidate.AssignedInterviewers = interviewerIds;

            await _context.SaveChangesAsync();
        }

        public async Task<CandidateStageCountsResponse> GetStageCountsAsync()
        {
            var counts = await _context.Applications
                .AsNoTracking()
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var lookup = counts.ToDictionary(x => x.Status ?? "", x => x.Count);

            var topMatches = await _context.Applications
                .AsNoTracking()
                .Where(a => a.ATSscore != null && a.ATSscore >= 80)
                .CountAsync();

            return new CandidateStageCountsResponse
            {
                UnderReview = lookup.GetValueOrDefault("under_review"),
                Filtered = lookup.GetValueOrDefault("filtered"),
                Shortlisted = lookup.GetValueOrDefault("shortlisted"),
                Interviewing = lookup.GetValueOrDefault("interviewing"),
                Selected = lookup.GetValueOrDefault("selected"),
                Rejected = lookup.GetValueOrDefault("rejected"),
                TopMatches = topMatches,
            };
        }

        public async Task<Dictionary<string, int>> GetJobStageCountsAsync(string jobId)
        {
            return await _context.Applications
                .AsNoTracking()
                .Where(a => a.JobId == jobId)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status ?? "unknown", x => x.Count);
        }

    }
}
