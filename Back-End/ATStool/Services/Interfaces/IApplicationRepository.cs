using ATStool.DTOs.Applications;

namespace ATStool.Services.Interfaces
{
    public interface IApplicationRepository
    {
        Task<bool> ExistsAsync(string candidateId, string jobId);
        Task InsertAsync(string candidateId, string jobId, string blobId, string fileHash,string? content = null);

        // ✅ Add this — looks up by fileHash in Applications table
        Task<ApplicationLookupDto?> GetByHashAsync(string fileHash);
    }

}