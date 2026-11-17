namespace ATStool.DTOs.Applications
{
    public class ATSScoreCandidateInput
    {
        public string ApplicationId { get; set; } = string.Empty;
        public string CandidateId { get; set; }
        public string JobId { get; set; }
        public string Content { get; set; }
    }
}