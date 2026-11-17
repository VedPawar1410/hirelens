namespace ATStool.DTOs.Candidates
{
    //public class AssignCandidateDto
    //{
    //    public List<string> InterviewerIds { get; set; } = [];
    //}

    //public class CandidateResponse
    //{
    //    public string Id { get; set; } = string.Empty;
    //    public string Name { get; set; } = string.Empty;
    //    public string CurrentRole { get; set; } = string.Empty;
    //    public string? AvatarUrl { get; set; }
    //    public int MatchScore { get; set; }
    //    public bool IsDuplicate { get; set; }
    //    public AppliedJobDto AppliedJob { get; set; } = new();
    //    public string ApplicationSource { get; set; } = string.Empty;
    //    public string Status { get; set; } = string.Empty;
    //    public string AppliedDate { get; set; } = string.Empty;
    //}

    //public class AppliedJobDto
    //{
    //    public string Id { get; set; } = string.Empty;
    //    public string Title { get; set; } = string.Empty;
    //}

    //public class CandidateListResponse
    //{
    //    public List<CandidateResponse> Candidates { get; set; } = [];
    //    public int Total { get; set; }
    //    public int Page { get; set; }
    //    public int Limit { get; set; }
    //}

    public class CandidateResponse
    {
        public required string Id { get; set; }

        public required string Name { get; set; }

        public string? AvatarUrl { get; set; }

        public int? MatchScore { get; set; }

        public AppliedJobDto? AppliedJob { get; set; }

        public string? Status { get; set; }

        // Name of the round the candidate is currently on (only set while interviewing).
        public string? CurrentRound { get; set; }

        public required string AppliedDate { get; set; }

        public string CurrentRole { get; set; } = string.Empty;

        public bool IsDuplicate { get; set; } = false;

        public string ApplicationSource { get; set; } = "Direct Upload";

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? LinkedIn { get; set; }

        public string? GitHub { get; set; }

        public List<string>? Skills { get; set; }

        public int? Experience { get; set; }

        public string? Education { get; set; }
    }

    public class CandidateListResponse
    {
        public int Total { get; set; }

        public int Page { get; set; }

        public int Limit { get; set; }

        public List<CandidateResponse> Candidates { get; set; } = new();
    }

    public class AppliedJobDto
    {
        public required string Id { get; set; }

        public required string Title { get; set; }
    }

    public class CandidateStageCountsResponse
    {
        public int UnderReview { get; set; }
        public int Filtered { get; set; }
        public int Shortlisted { get; set; }
        public int Interviewing { get; set; }
        public int Selected { get; set; }
        public int Rejected { get; set; }
        public int TopMatches { get; set; }
    }
}
