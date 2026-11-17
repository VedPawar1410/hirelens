using ATStool.DTOs;
using ATStool.Models;

namespace ATStool.Services.Interfaces
{
    public interface ICandidateRepository
    {
        Task<(string CandidateId, string BlobId)?> GetByHashAsync(string fileHash);
        Task InsertAsync(ParsedCandidateDto candidate, string fileHash, string blobId);
        Task<List<Candidate>> GetCandidatesByJobIdAsync(string jobId);

        Task<Dictionary<string, int>> GetCandidateCountsByJobIdsAsync(List<string> jobIds);
        Task<Dictionary<string, int>> GetFilteredCandidateCountsByJobIdsAsync(List<string> jobIds);
        Task<Dictionary<string, List<(string Name, string? AvatarUrl)>>> GetTopCandidatesByJobIdsAsync(List<string> jobIds, int top = 3);

        Task<Dictionary<string, List<int>>> GetApplicationHistoryByJobIdsAsync(List<string> jobIds, int days = 8);

        //Duplicate detection
        Task<(string CandidateId, string BlobId)?> GetByEmailAsync(string? email);
        Task<(string CandidateId, string BlobId)?> GetByPhoneAsync(string phone);
    }
}