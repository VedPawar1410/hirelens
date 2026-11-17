namespace ATStool.DTOs
{
    public class UploadResumeResponse
    {
        public int Processed { get; set; }          // ✅ renamed from TotalUploaded
        public List<FileResultDto> Categorized { get; set; } = new();  // ✅ renamed from Results
    }

    public class FileResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public MatchedJobDto? MatchedJob { get; set; }          // ✅ added
        public string Status { get; set; } = string.Empty;      // "categorized" | "unmatched"
        public string? CandidateId { get; set; }
        public string? Error { get; set; }
        public double? AtsScore { get; set; }
    }

    public class MatchedJobDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
    }
}
