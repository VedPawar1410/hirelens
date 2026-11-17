namespace ATStool.DTOs.Jobs
{
    public class TopCandidateDto
    {
        public string Name { get; set; } = string.Empty;

        public string? AvatarUrl { get; set; }
    }

    public class JobFolderResponse
    {
        public string Id { get; set; } = string.Empty;

        public string JobTitle { get; set; } = string.Empty;

        public string? Department { get; set; }

        public string Location { get; set; } = string.Empty;

        public int CandidatesCount { get; set; }

        public int FilteredCount { get; set; }

        public string Status { get; set; } = string.Empty;

        public string CreatedAt { get; set; } = string.Empty;

        public List<TopCandidateDto> TopCandidates { get; set; } = [];

        public List<int> ApplicationHistory { get; set; } = [];
    }

    public class JobFolderListResponse
    {
        public List<JobFolderResponse> Jobs { get; set; } = [];

        public int Total { get; set; }

        public int Page { get; set; }

        public int Limit { get; set; }
    }

    public class PatchFolderStatusRequest
    {
        public string FolderStatus { get; set; } = string.Empty;
    }
}
