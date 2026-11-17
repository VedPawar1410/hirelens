using System.ComponentModel.DataAnnotations;

namespace ATStool.DTOs.Interviews
{
    public class CreateInterviewDto
    {
        // ── Core fields (frontend sends) ────────────────────────────────

        [Required]
        public string CandidateId { get; set; } = string.Empty;

        [Required]
        public string JobId { get; set; } = string.Empty;

        [Required]
        public string InterviewerId { get; set; } = string.Empty;

        [Required]
        public DateTimeOffset ScheduledAt { get; set; }

        public int DurationMinutes { get; set; } = 60;

        [Required]
        [MaxLength(50)]
        public string InterviewType { get; set; } = string.Empty;
        // The configured round's type, e.g. "Technical", "Managerial", "HR", "Final"

        public int InterviewRound { get; set; } = 1;

        [MaxLength(100)]
        public string RoundName { get; set; } = string.Empty;
        // The configured round's display name, snapshotted at scheduling time

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        // ── AI/ML fields (frontend sends) ───────────────────────────────

        [Required]
        public string ResumeBase64 { get; set; } = string.Empty;

        [Required]
        public string JdBase64 { get; set; } = string.Empty;

        public string? AdditionalInstructions { get; set; }
    }

    public class UpdateInterviewDto
    {
        public DateTimeOffset? ScheduledAt { get; set; }
        public int? DurationMinutes { get; set; }

        [MaxLength(50)]
        public string? InterviewType { get; set; }

        public int? InterviewRound { get; set; }

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        [MaxLength(255)]
        public string? Location { get; set; }

        [MaxLength(30)]
        public string? Status { get; set; }

        [MaxLength(500)]
        public string? NoShowReason { get; set; }
    }

    public class SkipRoundDto
    {
        [Required]
        public string CandidateId { get; set; } = string.Empty;

        [Required]
        public string JobId { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Round must be at least 1.")]
        public int Round { get; set; }
    }

    public class SubmitFeedbackDto
    {
        [Range(1, 5)]
        public byte OverallRating { get; set; }

        [MaxLength(20)]
        public string? Recommendation { get; set; }

        public string? FeedbackNotes { get; set; }
    }

    public class InterviewResponseDto
    {
        public string InterviewId { get; set; } = string.Empty;
        public string CandidateId { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty;
        public string InterviewerId { get; set; } = string.Empty;
        public DateTimeOffset ScheduledAt { get; set; }
        public int DurationMinutes { get; set; }
        public string InterviewType { get; set; } = string.Empty;
        public int InterviewRound { get; set; }
        public string RoundName { get; set; } = string.Empty;
        public string? MeetingLink { get; set; }
        public string? Location { get; set; }
        public string InterviewMode { get; set; } = "online";
        public string Status { get; set; } = string.Empty;
        public byte? OverallRating { get; set; }
        public string? Recommendation { get; set; }
        public string? FeedbackNotes { get; set; }
        public string? NoShowReason { get; set; }
        public byte RescheduleCount { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class InterviewWithDetailsResponseDto : InterviewResponseDto
    {
        public string? CandidateName { get; set; }
        public string? CandidateRole { get; set; }
        public double? CandidateMatchScore { get; set; }
        public string? CandidateAvatarUrl { get; set; }
        public List<string>? CandidateSkills { get; set; }
        public string? JobTitle { get; set; }
    }

    public class UpcomingInterviewsSummaryDto
    {
        public int Count { get; set; }
        public DateTimeOffset? NextInterviewAt { get; set; }
        public string? NextCandidateName { get; set; }
        public string? NextCandidateId { get; set; }
        public string? NextJobId { get; set; }
    }

    public class InterviewEmailNotificationPayload
    {
        public string InterviewId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string InterviewerName { get; set; } = string.Empty;
        public string InterviewerEmail { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string InterviewRound { get; set; } = string.Empty;
        public string InterviewType { get; set; } = string.Empty;
        public string InterviewMode { get; set; } = "online";
        public DateTimeOffset StartTime { get; set; }
        public DateTimeOffset EndTime { get; set; }
        public int DurationMinutes { get; set; }
        public string Timezone { get; set; } = "Asia/Kolkata";
        public string? MeetingLink { get; set; }
        public string? Location { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public string CreatedByUserEmail { get; set; } = string.Empty;
        public string ResumeBase64 { get; set; } = string.Empty;
        public string JdBase64 { get; set; } = string.Empty;
        public string? AdditionalInstructions { get; set; }
    }

    public class InterviewEmailNotificationResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }
    }

    public class RescheduleInterviewDto
    {
        // ── Reschedule fields (all optional — only update what changed) ──────

        public DateTimeOffset? ScheduledAt { get; set; }

        public int? DurationMinutes { get; set; }

        public string? InterviewerId { get; set; }

        public string? MeetingLink { get; set; }

        public string? InterviewType { get; set; }

        public int? InterviewRound { get; set; }

        // ── AI/ML fields (required for email notification) ───────────────────

        [Required]
        public string ResumeBase64 { get; set; } = string.Empty;

        [Required]
        public string JdBase64 { get; set; } = string.Empty;

        public string? AdditionalInstructions { get; set; }
    }

    public class InterviewRescheduleNotificationPayload
    {
        // ── Existing fields ──────────────────────────────────────────────────
        public string InterviewId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string InterviewerName { get; set; } = string.Empty;
        public string InterviewerEmail { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string InterviewRound { get; set; } = string.Empty;
        public string InterviewType { get; set; } = string.Empty;
        public string InterviewMode { get; set; } = string.Empty;
        public DateTimeOffset StartTime { get; set; }
        public DateTimeOffset EndTime { get; set; }
        public int DurationMinutes { get; set; }
        public string Timezone { get; set; } = string.Empty;
        public string? MeetingLink { get; set; }
        public string? Location { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public string CreatedByUserEmail { get; set; } = string.Empty;

        // ── AI/ML fields (same as Create) ───────────────────────────────────
        public string ResumeBase64 { get; set; } = string.Empty;
        public string JdBase64 { get; set; } = string.Empty;
        public string? AdditionalInstructions { get; set; }
    }

    public class InterviewCancelNotificationPayload
    {
        public string InterviewId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string InterviewerName { get; set; } = string.Empty;
        public string InterviewerEmail { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string InterviewRound { get; set; } = string.Empty;
        public string InterviewType { get; set; } = string.Empty;
        public string Timezone { get; set; } = "Asia/Kolkata";
    }
}
