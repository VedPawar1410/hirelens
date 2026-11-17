using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ATStool.Models;
using System.Text.Json;

namespace ATStool.Models
{
    [Table("Candidates")]
    public class Candidate
    {

        [Key]
        [Column("CandidateId")]
        public string CandidateId { get; set; } = string.Empty;

        [Column("name")]
        public string? Name { get; set; }

        [Column("email")]
        public string? Email { get; set; }

        [Column("phone")]
        public string? Phone { get; set; }

        public string? LinkedIn { get; set; }

        public string? GitHub { get; set; }

        [Column("avatarUrl")]
        public string? AvatarUrl { get; set; }

        // ✅ DB column — stores JSON string
        [Column("skills")]
        public string SkillsJson { get; set; } = "[]";

        // ✅ NOT a DB column — use this in your code
        [NotMapped]
        public List<string> Skills
        {
            get => JsonSerializer.Deserialize<List<string>>(SkillsJson) ?? new();
            set => SkillsJson = JsonSerializer.Serialize(value);
        }

        [Column("experience")]
        public int? Experience { get; set; }

        [Column("education")]
        public string? Education { get; set; }

        [Column("content")]
        public string? Content { get; set; }

        [Column("ATSScore")]
        public int? ATSscore { get; set; }

        [Required]
        [Column("fileHash")]
        public string FileHash { get; set; } = string.Empty;

        [Required]
        [Column("blobId")]
        public string BlobId { get; set; } = string.Empty;

        public ICollection<Application> Applications { get; set; } = new List<Application>();

        [Column("assignedInterviewers")]
        public string AssignedInterviewersJson { get; set; } = "[]";

        [NotMapped]
        public List<string> AssignedInterviewers
        {
            get => JsonSerializer.Deserialize<List<string>>(AssignedInterviewersJson) ?? new();
            set => AssignedInterviewersJson = JsonSerializer.Serialize(value);
        }


        [Column("status")]
        public string? Status { get; set; } = "under_review";

        [Column("appliedDate")]
        public DateTime AppliedDate { get; set; } = DateTime.UtcNow;   // ✅ add this

    }
}