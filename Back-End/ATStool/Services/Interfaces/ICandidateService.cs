using ATStool.DTOs.Candidates;

namespace ATStool.Services.Interfaces
{
    public interface ICandidateService
    {
        Task<CandidateListResponse> GetCandidatesAsync(int page, int limit, string? status, string? search, string? jobId, string? sortBy = null, string? sortDir = null, int? minScore = null);
        // ICandidateService
        Task<string> MoveToNextStageAsync(string candidateId, string jobId);
        Task<string> MoveToPreviousStageAsync(string candidateId, string jobId);
        Task<string> ShortlistAsync(string candidateId, string jobId);
        Task<string> RejectAsync(string candidateId, string jobId);
        Task AssignInterviewersAsync(string candidateId, List<string> interviewerIds); // unchanged
        Task<CandidateDetailResponse> GetCandidateDetailAsync(string candidateId, string jobId, bool includeJobDescription = true);
        Task<CandidateStageCountsResponse> GetStageCountsAsync();
        Task<Dictionary<string, int>> GetJobStageCountsAsync(string jobId);
    }
}
