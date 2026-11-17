using Microsoft.EntityFrameworkCore;
using ATStool.Data;
using ATStool.DTOs.Dashboard;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly IDbContextFactory<AppDbContext> _contextFactory;

        public DashboardService(AppDbContext context, IDbContextFactory<AppDbContext> contextFactory)
        {
            _context = context;
            _contextFactory = contextFactory;
        }

        public async Task<DashboardStatsDto> GetStatsAsync()
        {
            await using var ctx1 = _contextFactory.CreateDbContext();
            await using var ctx2 = _contextFactory.CreateDbContext();
            await using var ctx3 = _contextFactory.CreateDbContext();
            await using var ctx4 = _contextFactory.CreateDbContext();

            var t1 = ctx1.Jobs.CountAsync(j => j.Status == "finalized" && j.FolderStatus == "active");
            var t2 = ctx2.Applications.CountAsync();
            var t3 = ctx3.Applications.CountAsync(a => a.ATSscore >= 80);
            var t4 = ctx4.Interviews.CountAsync(i => i.Status == "Scheduled");

            await Task.WhenAll(t1, t2, t3, t4);

            return new DashboardStatsDto
            {
                ActiveJobs = t1.Result,
                TotalApplications = t2.Result,
                AiMatches = t3.Result,
                InterviewsPending = t4.Result
            };
        }

        public async Task<List<ApplicationVolumeDayDto>> GetApplicationVolumeAsync(string period)
        {
            var days = period switch
            {
                "90d" => 90,
                "30d" => 30,
                _ => 7
            };

            var since = DateTime.UtcNow.Date.AddDays(-days + 1);

            var countsByDate = await _context.Applications
                .Where(a => a.AppliedAt >= since)
                .GroupBy(a => a.AppliedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var lookup = countsByDate.ToDictionary(x => x.Date, x => x.Count);

            return Enumerable.Range(0, days)
                .Select(i =>
                {
                    var date = since.AddDays(i);
                    return new ApplicationVolumeDayDto
                    {
                        Day = date.ToString("MMM d"),
                        Apps = lookup.GetValueOrDefault(date, 0)
                    };
                })
                .ToList();
        }

        public async Task<List<RecentJobFolderDto>> GetRecentJobFoldersAsync(int limit)
        {
            var jobs = await _context.Jobs
                .Where(j => j.Status == "finalized")
                .OrderByDescending(j => j.CreatedAt)
                .Take(limit)
                .ToListAsync();

            var jobIds = jobs.Select(j => j.Id.ToString()).ToList();

            var candidateCounts = await _context.Applications
                .Where(a => jobIds.Contains(a.JobId))
                .GroupBy(a => a.JobId)
                .Select(g => new { JobId = g.Key, Count = g.Count() })
                .ToListAsync();

            return jobs.Select(j => new RecentJobFolderDto
            {
                Id = j.Id.ToString(),
                JobTitle = j.JobTitle,
                Department = j.Department,
                Location = j.Location,
                CandidatesCount = candidateCounts.FirstOrDefault(c => c.JobId == j.Id.ToString())?.Count ?? 0,
                Status = string.IsNullOrEmpty(j.FolderStatus) ? "active" : j.FolderStatus,
                CreatedAt = j.CreatedAt.ToString("o")
            }).ToList();
        }

        public async Task<PipelineFunnelDto> GetPipelineFunnelAsync()
        {
            var stageOrder = new[]
            {
                ("filtered",     "Filtered"),
                ("shortlisted",  "Shortlisted"),
                ("interviewing", "Interviewing"),
                ("selected",     "Selected"),
            };

            // statusCounts and selectedApps are independent — run in parallel.
            // totalPipeline is derived from statusCounts (same WHERE clause), saving a third round-trip.
            await using var ctx1 = _contextFactory.CreateDbContext();
            await using var ctx2 = _contextFactory.CreateDbContext();

            var t1 = ctx1.Applications
                .Where(a => a.Status != null && a.Status != "rejected")
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var t2 = ctx2.Applications
                .Where(a => a.Status == "selected")
                .Select(a => a.AppliedAt)
                .ToListAsync();

            await Task.WhenAll(t1, t2);

            var statusCounts = t1.Result;
            var selectedApps = t2.Result;

            var lookup = statusCounts.ToDictionary(x => x.Status ?? "", x => x.Count);
            var totalPipeline = statusCounts.Sum(x => x.Count);

            var stages = stageOrder.Select(s => new PipelineStageDto
            {
                Stage = s.Item1,
                Label = s.Item2,
                Count = lookup.GetValueOrDefault(s.Item1, 0),
            }).ToList();

            var selectedCount = lookup.GetValueOrDefault("selected", 0);
            var selectedRate = totalPipeline > 0 ? Math.Round((double)selectedCount / totalPipeline * 100, 1) : 0;

            var avgCycleDays = selectedApps.Count > 0
                ? (int)selectedApps.Average(d => (DateTime.UtcNow - d).TotalDays)
                : 0;

            return new PipelineFunnelDto
            {
                Stages = stages,
                SelectedRate = selectedRate,
                AvgCycleDays = avgCycleDays,
            };
        }

        public async Task<List<AttentionItemDto>> GetAttentionItemsAsync()
        {
            var items = new List<AttentionItemDto>();
            var now = DateTime.UtcNow;
            var nowOffset = DateTimeOffset.UtcNow;
            var next24h = nowOffset.AddHours(24);
            var pendingCutoff = now.AddDays(-3);

            // Batch 1: queries 1, 2, 3, 4a are all independent — fire in parallel.
            await using var ctx1 = _contextFactory.CreateDbContext();
            await using var ctx2 = _contextFactory.CreateDbContext();
            await using var ctx3 = _contextFactory.CreateDbContext();
            await using var ctx4 = _contextFactory.CreateDbContext();

            var t1 = ctx1.Applications
                .Where(a => a.Status == "under_review" && a.AppliedAt < pendingCutoff)
                .OrderBy(a => a.AppliedAt)
                .Join(ctx1.Jobs, a => a.JobId, j => j.Id.ToString(), (a, j) => j.JobTitle)
                .ToListAsync();

            var t2 = ctx2.Applications
                .AsNoTracking()
                .Include(a => a.Candidate)
                .Where(a => a.ATSscore >= 90 && (a.Status == "under_review" || a.Status == "filtered"))
                .OrderByDescending(a => a.ATSscore)
                .Select(a => a.Candidate!.Name ?? "Unknown")
                .ToListAsync();

            var t3 = ctx3.Interviews
                .Include(i => i.Candidate)
                .Where(i => i.Status == "Scheduled" && i.ScheduledAt >= nowOffset && i.ScheduledAt <= next24h)
                .OrderBy(i => i.ScheduledAt)
                .ToListAsync();

            var t4 = ctx4.Applications
                .Where(a => a.Status == "shortlisted")
                .Select(a => a.CandidateId)
                .Distinct()
                .ToListAsync();

            await Task.WhenAll(t1, t2, t3, t4);

            var pendingReviewApps = t1.Result;
            var topMatchApps = t2.Result;
            var upcomingInterviews = t3.Result;
            var shortlistedCandidateIds = t4.Result;

            if (pendingReviewApps.Count > 0)
                items.Add(new AttentionItemDto
                {
                    Type = "pending_review",
                    Count = pendingReviewApps.Count,
                    Title = $"{pendingReviewApps.Count} candidate{(pendingReviewApps.Count == 1 ? "" : "s")} waiting on screening",
                    Subtitle = $"Oldest: {pendingReviewApps.First()}",
                    ActionPath = "/recruitment/candidates",
                });

            if (topMatchApps.Count > 0)
                items.Add(new AttentionItemDto
                {
                    Type = "ai_matches",
                    Count = topMatchApps.Count,
                    Title = $"{topMatchApps.Count} AI match{(topMatchApps.Count == 1 ? "" : "es")} above 90%",
                    Subtitle = string.Join(", ", topMatchApps.Take(3)),
                    ActionPath = "/recruitment/candidates",
                });

            if (upcomingInterviews.Count > 0)
            {
                var next = upcomingInterviews[0];
                items.Add(new AttentionItemDto
                {
                    Type = "upcoming_interviews",
                    Count = upcomingInterviews.Count,
                    Title = $"{upcomingInterviews.Count} interview{(upcomingInterviews.Count == 1 ? "" : "s")} scheduled next 24h",
                    ActionPath = "/recruitment/candidates",
                    NextInterviewAt = next.ScheduledAt,
                    NextCandidateName = next.Candidate?.Name,
                    NextCandidateId = next.CandidateId,
                    NextJobId = next.JobId.ToString(),
                });
            }

            // Batch 2: shortlisted-with-interview depends on shortlistedCandidateIds from batch 1.
            await using var ctx5 = _contextFactory.CreateDbContext();
            var shortlistedWithInterview = await ctx5.Interviews
                .Where(i => shortlistedCandidateIds.Contains(i.CandidateId))
                .Select(i => i.CandidateId)
                .Distinct()
                .CountAsync();

            var awaitingInterview = shortlistedCandidateIds.Count - shortlistedWithInterview;

            if (awaitingInterview > 0)
                items.Add(new AttentionItemDto
                {
                    Type = "shortlisted_pending",
                    Count = awaitingInterview,
                    Title = $"{awaitingInterview} shortlisted, no interview scheduled",
                    Subtitle = "Ready for next step",
                    ActionPath = "/recruitment/candidates",
                });

            return items;
        }
    }
}
