namespace ATStool.DTOs.Applications
{
    public class ApplicationLookupDto
    {
        public string CandidateId { get; set; }
        public string BlobId { get; set; }
        public string? Content { get; set; }    // ✅ add this
    }
}