using System.ComponentModel.DataAnnotations;

namespace ATStool.Models
{
    public class Interview
    {
        [Key]
        public string InterviewId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string CandidateId { get; set; } = string.Empty;

        [Required]
        public Guid JobId { get; set; }

        [Required]
        public string InterviewerId { get; set; } = string.Empty;

        [Required]
        public string CreatedBy { get; set; } = string.Empty;

        [Required]
        public DateTimeOffset ScheduledAt { get; set; }

        [Required]
        public int DurationMinutes { get; set; } = 60;

        [Required]
        [MaxLength(50)]
        public string InterviewType { get; set; } = string.Empty;
        // e.g. "PhoneScreen", "Technical", "HR", "Panel", "Final"

        [Required]
        public int InterviewRound { get; set; } = 1;

        [MaxLength(100)]
        public string RoundName { get; set; } = string.Empty;
        // Snapshot of the job's configured round name at scheduling time (e.g. "Tech Round 1")

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        [MaxLength(255)]
        public string? Location { get; set; }

        [Required]
        [MaxLength(20)]
        public string InterviewMode { get; set; } = "online";

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Scheduled";
        // e.g. "Scheduled", "Confirmed", "Completed", "Cancelled", "NoShow"

        [Range(1, 5)]
        public byte? OverallRating { get; set; }

        [MaxLength(20)]
        public string? Recommendation { get; set; }
        // e.g. "StrongHire", "Hire", "Hold", "NoHire"

        public string? FeedbackNotes { get; set; }

        [MaxLength(500)]
        public string? NoShowReason { get; set; }

        public byte RescheduleCount { get; set; } = 0;

        [MaxLength(255)]
        public string? CalendarEventId { get; set; }

        public DateTimeOffset? ReminderSentAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation Properties
        public Candidate? Candidate { get; set; }
        public Job? Job { get; set; }
        public User? Interviewer { get; set; }
        public User? CreatedByUser { get; set; }
    }
}
