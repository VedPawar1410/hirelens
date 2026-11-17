using Microsoft.EntityFrameworkCore;
using ATStool.Data;
using ATStool.Models;
using ATStool.DTOs.Interviews;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class InterviewService : IInterviewService
    {
        private readonly AppDbContext _context;
        private readonly IInterviewEmailNotificationService _emailNotificationService;

        public InterviewService(
            AppDbContext context,
            IInterviewEmailNotificationService emailNotificationService)
        {
            _context = context;
            _emailNotificationService = emailNotificationService;
        }

        public async Task<IEnumerable<InterviewResponseDto>> GetAllAsync()
        {
            return await _context.Interviews
                .AsNoTracking()
                .OrderBy(i => i.ScheduledAt)
                .Select(i => MapToDto(i))
                .ToListAsync();
        }

        public async Task<InterviewResponseDto?> GetByIdAsync(string interviewId)
        {
            var interview = await _context.Interviews
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            return interview is null ? null : MapToDto(interview);
        }

        public async Task<IEnumerable<InterviewResponseDto>> GetByCandidateIdAsync(string candidateId,string jobId)
        {
            return await _context.Interviews
                .AsNoTracking()
                .Where(i => i.CandidateId == candidateId && i.JobId.ToString() == jobId)
                .OrderBy(i => i.InterviewRound)
                .Select(i => MapToDto(i))
                .ToListAsync();
        }

        public async Task<IEnumerable<InterviewResponseDto>> GetByJobIdAsync(Guid jobId)
        {
            return await _context.Interviews
                .AsNoTracking()
                .Where(i => i.JobId == jobId)
                .OrderBy(i => i.ScheduledAt)
                .Select(i => MapToDto(i))
                .ToListAsync();
        }

        public async Task<IEnumerable<InterviewResponseDto>> GetByInterviewerIdAsync(string interviewerId)
        {
            return await _context.Interviews
                .AsNoTracking()
                .Where(i => i.InterviewerId == interviewerId)
                .OrderBy(i => i.ScheduledAt)
                .Select(i => MapToDto(i))
                .ToListAsync();
        }

        public async Task<IEnumerable<InterviewWithDetailsResponseDto>> GetByInterviewerIdWithDetailsAsync(string interviewerId)
        {
            var interviews = await _context.Interviews
                .AsNoTracking()
                .Include(i => i.Candidate)
                .Include(i => i.Job)
                .Where(i => i.InterviewerId == interviewerId)
                .OrderBy(i => i.ScheduledAt)
                .ToListAsync();

            var candidateIds = interviews.Select(i => i.CandidateId).Distinct().ToList();
            var jobIdStrings = interviews.Select(i => i.JobId.ToString()).Distinct().ToList();

            var atsLookup = await _context.Applications
                .AsNoTracking()
                .Where(a => candidateIds.Contains(a.CandidateId) && jobIdStrings.Contains(a.JobId))
                .ToDictionaryAsync(a => (a.CandidateId, a.JobId), a => a.ATSscore);

            return interviews.Select(i =>
            {
                var jobIdStr = i.JobId.ToString();
                atsLookup.TryGetValue((i.CandidateId, jobIdStr), out var matchScore);

                return new InterviewWithDetailsResponseDto
                {
                    InterviewId = i.InterviewId,
                    CandidateId = i.CandidateId,
                    JobId = jobIdStr,
                    InterviewerId = i.InterviewerId,
                    ScheduledAt = i.ScheduledAt,
                    DurationMinutes = i.DurationMinutes,
                    InterviewType = i.InterviewType,
                    InterviewRound = i.InterviewRound,
                    RoundName = i.RoundName,
                    MeetingLink = i.MeetingLink,
                    Location = i.Location,
                    Status = i.Status,
                    OverallRating = i.OverallRating,
                    Recommendation = i.Recommendation,
                    FeedbackNotes = i.FeedbackNotes,
                    NoShowReason = i.NoShowReason,
                    RescheduleCount = i.RescheduleCount,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    CandidateName = i.Candidate?.Name,
                    CandidateRole = null,
                    CandidateMatchScore = matchScore,
                    CandidateAvatarUrl = i.Candidate?.AvatarUrl,
                    CandidateSkills = i.Candidate?.Skills,
                    JobTitle = i.Job?.JobTitle,
                };
            });
        }

        public async Task<IEnumerable<InterviewResponseDto>> GetByStatusAsync(string status)
        {
            return await _context.Interviews
                .AsNoTracking()
                .Where(i => i.Status == status)
                .OrderBy(i => i.ScheduledAt)
                .Select(i => MapToDto(i))
                .ToListAsync();
        }

        public async Task<(InterviewResponseDto Interview, InterviewEmailNotificationResult EmailResult)> CreateAsync(CreateInterviewDto dto, string scheduledByUserId)
        {
            // ── Fetch required data from DB ─────────────────────────────────────
            var candidate = await _context.Candidates
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CandidateId == dto.CandidateId)
                ?? throw new KeyNotFoundException($"Candidate {dto.CandidateId} not found.");

            var job = await _context.Jobs
                .AsNoTracking()
                .FirstOrDefaultAsync(j => j.Id.ToString() == dto.JobId)
                ?? throw new KeyNotFoundException($"Job {dto.JobId} not found.");

            // Fetch interviewer and createdByUser in one WHERE Id IN (...) round-trip
            var userIds = new[] { dto.InterviewerId, scheduledByUserId }.Distinct().ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync();

            var interviewer = users.FirstOrDefault(u => u.Id == dto.InterviewerId)
                ?? throw new KeyNotFoundException($"Interviewer {dto.InterviewerId} not found.");
            var createdByUser = users.FirstOrDefault(u => u.Id == scheduledByUserId)
                ?? throw new KeyNotFoundException($"User {scheduledByUserId} not found.");

            // ── Guard against double-scheduling the same round ──────────────────
            var alreadyScheduled = await _context.Interviews
                .AnyAsync(i =>
                    i.CandidateId == dto.CandidateId &&
                    i.JobId == Guid.Parse(dto.JobId) &&
                    i.InterviewRound == dto.InterviewRound &&
                    i.Status == "Scheduled");

            if (alreadyScheduled)
                throw new InvalidOperationException($"Round {dto.InterviewRound} is already scheduled for this candidate.");

            // ── Save Interview to DB ────────────────────────────────────────────
            // ── Derive InterviewMode and Location from MeetingLink ──────────────
            var interviewMode = string.IsNullOrWhiteSpace(dto.MeetingLink) ? "offline" : "online";
            var location = string.IsNullOrWhiteSpace(dto.MeetingLink) ? "Company Office" : "Microsoft Teams Meeting";

            var interview = new Interview
            {
                InterviewId = Guid.NewGuid().ToString(),
                CandidateId = dto.CandidateId,
                JobId = Guid.Parse(dto.JobId),
                InterviewerId = dto.InterviewerId,
                CreatedBy = scheduledByUserId,
                ScheduledAt = dto.ScheduledAt,
                DurationMinutes = dto.DurationMinutes,
                InterviewType = dto.InterviewType,
                InterviewRound = dto.InterviewRound,
                RoundName = dto.RoundName,
                MeetingLink = dto.MeetingLink,
                InterviewMode = interviewMode,   // ← derived from MeetingLink
                Location = location,        // ← derived from MeetingLink
                Status = "Scheduled",
                RescheduleCount = 0,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Interviews.Add(interview);
            await _context.SaveChangesAsync();

            // Scheduling any round moves the candidate into the single "interviewing" stage.
            // Rounds are dynamic per job, so the stage no longer encodes a round number.
            if (!string.IsNullOrEmpty(dto.JobId))
            {
                string[] stageOrder = ["under_review", "filtered", "shortlisted", "interviewing", "selected"];
                var application = await _context.Applications
                    .FirstOrDefaultAsync(a => a.CandidateId == dto.CandidateId && a.JobId == dto.JobId);
                if (application != null)
                {
                    var currentIdx = Array.IndexOf(stageOrder, application.Status);
                    var targetIdx = Array.IndexOf(stageOrder, "interviewing");
                    if (currentIdx >= 0 && currentIdx < targetIdx)
                    {
                        application.Status = "interviewing";
                        await _context.SaveChangesAsync();
                    }
                }
            }

            // ── Email Notification (commented out until AI/ML is ready) ─────────
            
            var payload = new InterviewEmailNotificationPayload
            {
                InterviewId            = interview.InterviewId,
                CandidateName          = candidate?.Name ?? string.Empty,
                CandidateEmail         = candidate.Email,
                InterviewerName        = interviewer?.FullName ?? string.Empty,
                InterviewerEmail       = interviewer.Email,
                JobTitle               = job.JobTitle,
                CompanyName            = "Acme Corp",
                InterviewRound         = string.IsNullOrWhiteSpace(interview.RoundName) ? $"L{interview.InterviewRound}" : $"L{interview.InterviewRound}",
                InterviewType          = interview.InterviewType,
                InterviewMode          = interviewMode,        
                StartTime              = interview.ScheduledAt,
                EndTime                = interview.ScheduledAt.AddMinutes(interview.DurationMinutes),
                DurationMinutes        = interview.DurationMinutes,
                Timezone               = "Asia/Kolkata",       
                MeetingLink            = interview.MeetingLink,
                Location               = location,             
                CreatedByUserName      = createdByUser?.FullName ?? string.Empty,
                CreatedByUserEmail     = createdByUser.Email,
                ResumeBase64           = dto.ResumeBase64,
                JdBase64               = dto.JdBase64,
                AdditionalInstructions = dto.AdditionalInstructions
            };

            var emailResult = await _emailNotificationService.SendInterviewCreatedAsync(payload);
            return (MapToDto(interview), emailResult);
            

            // ── Temporary: return dummy success until AI/ML is ready ────────────
            //var dummyEmailResult = new InterviewEmailNotificationResult
            //{
            //    Success = true,
            //    Message = "Email notification skipped (AI/ML not ready).",
            //    Data = null
            //};

            //return (MapToDto(interview), dummyEmailResult);
        }

        public async Task<InterviewResponseDto?> UpdateAsync(string interviewId, UpdateInterviewDto dto)
        {
            var interview = await _context.Interviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview is null) return null;

            if (dto.ScheduledAt.HasValue) interview.ScheduledAt = dto.ScheduledAt.Value;
            if (dto.DurationMinutes.HasValue) interview.DurationMinutes = dto.DurationMinutes.Value;
            if (dto.InterviewType is not null) interview.InterviewType = dto.InterviewType;
            if (dto.InterviewRound.HasValue) interview.InterviewRound = dto.InterviewRound.Value;
            if (dto.MeetingLink is not null) interview.MeetingLink = dto.MeetingLink;
            if (dto.Location is not null) interview.Location = dto.Location;
            if (dto.Status is not null) interview.Status = dto.Status;
            if (dto.NoShowReason is not null) interview.NoShowReason = dto.NoShowReason;

            interview.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(interview);
        }

        public async Task<InterviewResponseDto?> SubmitFeedbackAsync(string interviewId, SubmitFeedbackDto dto)
        {
            var interview = await _context.Interviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview is null) return null;

            interview.OverallRating = dto.OverallRating;
            interview.Recommendation = dto.Recommendation;
            interview.FeedbackNotes = dto.FeedbackNotes;
            interview.Status = "Completed";
            interview.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(interview);
        }

        //public async Task<InterviewResponseDto?> RescheduleAsync(string interviewId, DateTimeOffset newScheduledAt)
        //{
        //    var interview = await _context.Interviews
        //        .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

        //    if (interview is null) return null;

        //    interview.ScheduledAt = newScheduledAt;
        //    interview.Status = "Scheduled";
        //    interview.RescheduleCount += 1;
        //    interview.UpdatedAt = DateTimeOffset.UtcNow;

        //    await _context.SaveChangesAsync();
        //    return MapToDto(interview);
        //}

        //public async Task<bool> CancelAsync(string interviewId, string? reason = null)
        //{
        //    var interview = await _context.Interviews
        //        .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

        //    if (interview is null) return false;

        //    interview.Status = "Cancelled";
        //    interview.NoShowReason = reason;
        //    interview.UpdatedAt = DateTimeOffset.UtcNow;

        //    await _context.SaveChangesAsync();
        //    return true;
        //}

        public async Task<bool> DeleteAsync(string interviewId)
        {
            var interview = await _context.Interviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview is null) return false;

            _context.Interviews.Remove(interview);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UpcomingInterviewsSummaryDto> GetUpcomingAsync(int hours)
        {
            var now = DateTimeOffset.UtcNow;
            var cutoff = now.AddHours(hours);

            var upcoming = await _context.Interviews
                .AsNoTracking()
                .Include(i => i.Candidate)
                .Where(i => i.Status == "Scheduled" && i.ScheduledAt >= now && i.ScheduledAt <= cutoff)
                .OrderBy(i => i.ScheduledAt)
                .ToListAsync();

            var next = upcoming.FirstOrDefault();

            return new UpcomingInterviewsSummaryDto
            {
                Count = upcoming.Count,
                NextInterviewAt = next?.ScheduledAt,
                NextCandidateName = next?.Candidate?.Name,
                NextCandidateId = next?.CandidateId,
                NextJobId = next?.JobId.ToString(),
            };
        }

        public async Task<(InterviewResponseDto Interview, InterviewEmailNotificationResult EmailResult)> RescheduleAsync(string interviewId, RescheduleInterviewDto dto)
        {
            var interview = await _context.Interviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview is null)
                return (null!, new InterviewEmailNotificationResult
                {
                    Success = false,
                    Message = "Interview not found."
                });

            // ── Apply changes ────────────────────────────────────────────────────
            if (dto.ScheduledAt.HasValue) interview.ScheduledAt = dto.ScheduledAt.Value;
            if (dto.DurationMinutes.HasValue) interview.DurationMinutes = dto.DurationMinutes.Value;
            if (dto.InterviewerId is not null) interview.InterviewerId = dto.InterviewerId;
            if (dto.InterviewType is not null) interview.InterviewType = dto.InterviewType;
            if (dto.InterviewRound.HasValue) interview.InterviewRound = dto.InterviewRound.Value;
            if (dto.MeetingLink is not null)
            {
                interview.MeetingLink = dto.MeetingLink;
                interview.InterviewMode = string.IsNullOrWhiteSpace(dto.MeetingLink) ? "offline" : "online";
                interview.Location = string.IsNullOrWhiteSpace(dto.MeetingLink) ? "Company Office" : "Microsoft Teams Meeting";
            }

            interview.Status = "Scheduled";
            interview.RescheduleCount += 1;
            interview.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            // ── Fetch related data for email ─────────────────────────────────────
            var candidate = await _context.Candidates.AsNoTracking()
                .FirstOrDefaultAsync(c => c.CandidateId == interview.CandidateId);

            var job = await _context.Jobs.AsNoTracking()
                .FirstOrDefaultAsync(j => j.Id == interview.JobId);

            // Fetch interviewer and createdByUser in one WHERE Id IN (...) round-trip
            var rescheduleUserIds = new[] { interview.InterviewerId, interview.CreatedBy }.Distinct().ToList();
            var rescheduleUsers = await _context.Users.AsNoTracking()
                .Where(u => rescheduleUserIds.Contains(u.Id))
                .ToListAsync();

            var interviewer = rescheduleUsers.FirstOrDefault(u => u.Id == interview.InterviewerId);
            var createdByUser = rescheduleUsers.FirstOrDefault(u => u.Id == interview.CreatedBy);

            // ── Build payload (same structure as Create) ─────────────────────────
            var payload = new InterviewRescheduleNotificationPayload
            {
                InterviewId            = interview.InterviewId,
                CandidateName          = candidate?.Name ?? string.Empty,
                CandidateEmail         = candidate?.Email ?? string.Empty,
                InterviewerName        = interviewer?.FullName ?? string.Empty,
                InterviewerEmail       = interviewer?.Email ?? string.Empty,
                JobTitle               = job?.JobTitle ?? string.Empty,
                CompanyName            = "Acme Corp",
                InterviewRound         = string.IsNullOrWhiteSpace(interview.RoundName) ? $"L{interview.InterviewRound}" : $"L{interview.InterviewRound}",
                InterviewType          = interview.InterviewType,
                InterviewMode          = interview.InterviewMode,
                StartTime              = interview.ScheduledAt,
                EndTime                = interview.ScheduledAt.AddMinutes(interview.DurationMinutes),
                DurationMinutes        = interview.DurationMinutes,
                Timezone               = "Asia/Kolkata",
                MeetingLink            = interview.MeetingLink,
                Location               = interview.Location,
                CreatedByUserName      = createdByUser?.FullName ?? string.Empty,
                CreatedByUserEmail     = createdByUser?.Email ?? string.Empty,
                ResumeBase64           = dto.ResumeBase64,
                JdBase64               = dto.JdBase64,
                AdditionalInstructions = dto.AdditionalInstructions
            };

            var emailResult = await _emailNotificationService.SendInterviewRescheduledAsync(payload);
            return (MapToDto(interview), emailResult);
        }

        public async Task<(bool Success, InterviewEmailNotificationResult EmailResult)> CancelAsync(string interviewId)
        {
            var interview = await _context.Interviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview is null)
                return (false, new InterviewEmailNotificationResult
                {
                    Success = false,
                    Message = "Interview not found."
                });

            interview.Status = "Cancelled";
            interview.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            // ── Fetch related data for email ────────────────────────────────────
            var candidate = await _context.Candidates.AsNoTracking()
                .FirstOrDefaultAsync(c => c.CandidateId == interview.CandidateId);

            var interviewer = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == interview.InterviewerId);

            var job = await _context.Jobs.AsNoTracking()
                .FirstOrDefaultAsync(j => j.Id == interview.JobId);

            // ── Email Notification (commented out until AI/ML is ready) ────────
            /*
            var payload = new InterviewCancelNotificationPayload
            {
                InterviewId      = interview.InterviewId,
                CandidateName    = candidate?.Name ?? string.Empty,
                CandidateEmail   = candidate?.Email ?? string.Empty,
                InterviewerName  = interviewer?.FullName ?? string.Empty,
                InterviewerEmail = interviewer?.Email ?? string.Empty,
                JobTitle         = job?.JobTitle ?? string.Empty,
                CompanyName      = "Acme Corp",
                InterviewRound   = interview.InterviewRound.ToString(),
                InterviewType    = interview.InterviewType,
                Timezone         = "Asia/Kolkata"
            };

            var emailResult = await _emailNotificationService.SendInterviewCancelledAsync(payload);
            return (true, emailResult);
            */

            var dummyEmailResult = new InterviewEmailNotificationResult
            {
                Success = true,
                Message = "Cancellation email notification skipped (AI/ML not ready).",
                Data = null
            };

            return (true, dummyEmailResult);
        }

        // InterviewService
        public async Task<InterviewResponseDto?> MarkNoShowAsync(string interviewId)
        {
            var interview = await _context.Interviews
                .FirstOrDefaultAsync(i => i.InterviewId == interviewId);

            if (interview is null) return null;

            interview.Status = "NoShow";
            interview.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(interview);
        }

        public async Task<List<int>> SkipRoundAsync(string candidateId, string jobId, int round, string skippedByUserId)
        {
            var application = await _context.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId)
                ?? throw new KeyNotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");

            if (!application.SkippedRounds.Any(s => s.Round == round))
            {
                application.SkippedRounds.Add(new SkippedRound
                {
                    Round = round,
                    SkippedBy = skippedByUserId,
                    SkippedAt = DateTimeOffset.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            return application.SkippedRounds.Select(s => s.Round).OrderBy(r => r).ToList();
        }

        public async Task<List<int>> UnskipRoundAsync(string candidateId, string jobId, int round)
        {
            var application = await _context.Applications
                .FirstOrDefaultAsync(a => a.CandidateId == candidateId && a.JobId == jobId)
                ?? throw new KeyNotFoundException($"Application for candidate {candidateId} and job {jobId} not found.");

            var toRemove = application.SkippedRounds.Where(s => s.Round == round).ToList();
            if (toRemove.Count > 0)
            {
                foreach (var s in toRemove)
                    application.SkippedRounds.Remove(s);
                await _context.SaveChangesAsync();
            }

            return application.SkippedRounds.Select(s => s.Round).OrderBy(r => r).ToList();
        }

        private static InterviewResponseDto MapToDto(Interview i) => new()
        {
            InterviewId = i.InterviewId,
            CandidateId = i.CandidateId,
            JobId = i.JobId.ToString(),
            InterviewerId = i.InterviewerId,
            ScheduledAt = i.ScheduledAt,
            DurationMinutes = i.DurationMinutes,
            InterviewType = i.InterviewType,
            InterviewRound = i.InterviewRound,
            RoundName = i.RoundName,
            MeetingLink = i.MeetingLink,
            Location = i.Location,
            InterviewMode = i.InterviewMode,
            Status = i.Status,
            OverallRating = i.OverallRating,
            Recommendation = i.Recommendation,
            FeedbackNotes = i.FeedbackNotes,
            NoShowReason = i.NoShowReason,
            RescheduleCount = i.RescheduleCount,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt
        };
    }
}
