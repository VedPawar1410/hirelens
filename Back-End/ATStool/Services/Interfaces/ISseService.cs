using ATStool.DTOs.Candidates;

namespace ATStool.Services.Interfaces
{
    public interface ISseService
    {
        void AddConnection(string jobId, HttpResponse response);
        void RemoveConnection(string jobId, HttpResponse response);
        Task PushCandidatesAsync(string jobId, List<CandidateResponse> candidates);
    }
}