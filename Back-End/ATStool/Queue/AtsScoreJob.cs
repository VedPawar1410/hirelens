namespace ATStool.Queue
{
    public record AtsScoreJob
    {
        public string CandidateId { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty;
        public string ResumeContent { get; set; } = string.Empty;
        public string JdContent { get; set; } = string.Empty;
        public int RetryCount { get; set; } = 0;

        public const int MaxRetries = 3;
    }
}
