namespace ATStool.DTOs
{
    public class CategorizationResultDto
    {
        public List<HashedFileDto> NewFiles { get; set; } = new();
        public List<NewApplicationDto> NewApplications { get; set; } = new();
        public List<HashedFileDto> Duplicates { get; set; } = new();
    }

    public class NewApplicationDto
    {
        public HashedFileDto HashedFile { get; set; }
        public string CandidateId { get; set; }
        public string BlobId { get; set; }
    }
}