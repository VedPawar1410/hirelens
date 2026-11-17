namespace ATStool.DTOs.Candidates
{
    public class CandidateDetailResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string? CurrentRole { get; set; }
        public string? AvatarUrl { get; set; }
        public int? MatchScore { get; set; }
        public bool IsDuplicate { get; set; }
        public AppliedJobDto? AppliedJob { get; set; }
        public string? ApplicationSource { get; set; }
        public string? Status { get; set; }
        public string? CurrentRound { get; set; }
        public string? AppliedDate { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? LinkedIn { get; set; }
        public string? GitHub { get; set; }
        public List<string>? Skills { get; set; }
        public int? Experience { get; set; }
        public string? Education { get; set; }

        // Round numbers (JobRound.Order) the recruiter skipped for this candidate on this job.
        public List<int> SkippedRounds { get; set; } = [];

        // ✅ Both PDFs sent as base64 in one response
        public string? ResumeBase64 { get; set; }
        public string? JobDescBase64 { get; set; }
        public string? ResumeFileName { get; set; }
        public string? JobDescFileName { get; set; }
    }
}