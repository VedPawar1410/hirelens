namespace ATStool.Models
{
    public class CandidateNote
    {
        public Guid NoteId { get; set; } = Guid.NewGuid();
        public string CandidateId { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
