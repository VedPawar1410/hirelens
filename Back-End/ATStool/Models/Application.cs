using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ATStool.Models
{

    [Table("applications")]
    public class Application
    {
        [Key]
        [Column("applicationId")]
        public string ApplicationId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("candidateId")]
        public string CandidateId { get; set; }

        [Required]
        [Column("jobId")]
        public string JobId { get; set; }

        [Required]
        [Column("blobId")]
        public string BlobId { get; set; }

        [Required]
        [Column("fileHash")]
        public string FileHash { get; set; }

        [Column("status")]
        public string Status { get; set; } = "under_review";   // applied | reviewed | rejected | hired

        [Column("appliedAt")]
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        [Column("atsScore")]
        public double? ATSscore { get; set; }

        [Column("content")]
        public string? Content { get; set; }

        // Rounds the recruiter explicitly skipped for this candidate on this job. Persisted as JSON (owned collection).
        public List<SkippedRound> SkippedRounds { get; set; } = [];

        [ForeignKey("CandidateId")]
        public Candidate? Candidate { get; set; }
    }
}