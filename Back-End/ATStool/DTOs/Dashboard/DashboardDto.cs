namespace ATStool.DTOs.Dashboard
{
    public class DashboardStatsDto
    {
        public int ActiveJobs { get; set; }

        public int TotalApplications { get; set; }

        public int AiMatches { get; set; }

        public int InterviewsPending { get; set; }
    }

    public class ApplicationVolumeDayDto
    {
        public string Day { get; set; } = string.Empty;

        public int Apps { get; set; }
    }

    public class RecentJobFolderDto
    {
        public string Id { get; set; } = string.Empty;

        public string JobTitle { get; set; } = string.Empty;

        public string? Department { get; set; }

        public string Location { get; set; } = string.Empty;

        public int CandidatesCount { get; set; }

        public string Status { get; set; } = string.Empty;

        public string CreatedAt { get; set; } = string.Empty;
    }

    public class PipelineStageDto
    {
        public string Stage { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class PipelineFunnelDto
    {
        public List<PipelineStageDto> Stages { get; set; } = new();
        public double SelectedRate { get; set; }
        public int AvgCycleDays { get; set; }
    }

    public class AttentionItemDto
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string ActionPath { get; set; } = string.Empty;

        // Populated only for "upcoming_interviews" so the client can format the
        // time in the viewer's local zone and deep-link to the candidate.
        public DateTimeOffset? NextInterviewAt { get; set; }
        public string? NextCandidateName { get; set; }
        public string? NextCandidateId { get; set; }
        public string? NextJobId { get; set; }
    }
}
