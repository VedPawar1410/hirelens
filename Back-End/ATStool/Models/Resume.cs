using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ATStool.Models
{
    public class Resume
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Filename { get; set; } = string.Empty;

        // Relative path under the uploads directory (not exposed to frontend).
        public string StoragePath { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // 'processed' | 'unprocessed'
        public string Status { get; set; } = "unprocessed";

        public int? MatchScore { get; set; }

        public Guid? JobId { get; set; }

        [ForeignKey(nameof(JobId))]
        public Job? Job { get; set; }

        public Guid? CandidateId { get; set; }

        [ForeignKey(nameof(CandidateId))]
        public Candidate? Candidate { get; set; }

        public string? ErrorReason { get; set; }
    }
}
