using System.ComponentModel.DataAnnotations;
using ATStool.Models;

namespace ATStool.DTOs.Jobs
{
    public class CreateJobDto : IValidatableObject
    {
        [Required(ErrorMessage = "Job must have a title.")]
        public string JobTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job must have a location.")]
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

        public List<string>? AssignedTo { get; set; }

        // Ordered interview rounds configured for this job.
        public List<JobRound>? InterviewRounds { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (string.IsNullOrWhiteSpace(ExperienceLevel))
            {
                yield return new ValidationResult("Experience level is required.", new[] { "experience_level" });
                yield break;
            }

            if (string.IsNullOrWhiteSpace(WorkMode))
                yield return new ValidationResult("Work mode is required.", new[] { "work_mode" });

            if (string.IsNullOrWhiteSpace(WorkHours))
                yield return new ValidationResult("Work hours are required.", new[] { "work_hours" });

            if (ExperienceLevel == "intern")
            {
                if (string.IsNullOrWhiteSpace(Duration))
                    yield return new ValidationResult("Duration is required.", new[] { "duration" });
                if (string.IsNullOrWhiteSpace(StipendSalary))
                    yield return new ValidationResult("Stipend is required.", new[] { "stipend_salary" });
                if (string.IsNullOrWhiteSpace(FulltimeOfferSalary))
                    yield return new ValidationResult("Conversion salary is required.", new[] { "fulltime_offer_salary" });
            }
            else if (ExperienceLevel == "fresher")
            {
                if (string.IsNullOrWhiteSpace(FulltimeOfferSalary))
                    yield return new ValidationResult("Salary is required.", new[] { "fulltime_offer_salary" });
            }
            else if (ExperienceLevel == "experienced")
            {
                if (string.IsNullOrWhiteSpace(YearsOfExperience))
                    yield return new ValidationResult("Experience years are required.", new[] { "years_of_experience" });
                if (string.IsNullOrWhiteSpace(NoticePeriod))
                    yield return new ValidationResult("Notice period is required.", new[] { "notice_period" });
            }
        }
    }
}
