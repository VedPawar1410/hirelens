using System.ComponentModel.DataAnnotations;
using ATStool.Models;

namespace ATStool.DTOs.Jobs
{
    public class FinalizeDraftDto
    {
        // The recruiter-edited JD content that becomes the canonical role_description.
        [Required]
        public string FinalJD { get; set; } = string.Empty;

        public string? ExperienceLevel { get; set; }

        public string? JobTitle { get; set; }

        public string? Location { get; set; }

        public string? WorkMode { get; set; }

        public string? WorkHours { get; set; }

        public string? Duration { get; set; }

        public string? StipendSalary { get; set; }

        public string? FulltimeOfferSalary { get; set; }

        public string? YearsOfExperience { get; set; }

        public string? NoticePeriod { get; set; }

        public string? RelevantExperience { get; set; }

        public string? RoleDescription { get; set; }

        public List<string>? AssignedTo { get; set; }

        public List<JobRound>? InterviewRounds { get; set; }
    }
}
