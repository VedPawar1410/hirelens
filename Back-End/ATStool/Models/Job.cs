using System.ComponentModel.DataAnnotations;

namespace ATStool.Models
{
    public class Job
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required(ErrorMessage = "Job must have a title")]
        public string JobTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job must have a location")]
        public string Location { get; set; } = string.Empty;

        public string? ExperienceLevel { get; set; }
        public string? WorkMode { get; set; }
        public string? WorkHours { get; set; }
        public string? Duration { get; set; }
        public string? StipendSalary { get; set; }
        public string? FulltimeOfferSalary { get; set; }
        public string? YearsOfExperience { get; set; }
        public string? NoticePeriod { get; set; }
        public string? RelevantExperience { get; set; }
        public string? RoleDescription { get; set; }
        public string? GeneratedJd { get; set; }
        public string? Department { get; set; }

        // ── Lifecycle fields — defaults set by the backend on creation ───
        public string Status { get; set; } = "draft";

        // Active/paused/closed — only relevant once the job is finalized (becomes a job folder).
        public string FolderStatus { get; set; } = "active";

        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Written by the assign-draft and dismiss-draft flows based on recruiter actions.
        public List<string> AssignedTo { get; set; } = [];

        // Ordered, per-job interview round definitions. Persisted as JSON (owned collection).
        public List<JobRound> InterviewRounds { get; set; } = [];
    }
}
