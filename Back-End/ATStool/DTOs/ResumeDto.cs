namespace ATStool.DTOs
{
    public class ResumeDto
    {
        public string Id { get; set; } = string.Empty;
        public string Filename { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string Status { get; set; } = "processed";
        public double? MatchScore { get; set; }
        public string? CandidateId { get; set; }
        public string? ErrorReason { get; set; }
    }
}
