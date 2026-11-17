using ATStool.DTOs.Jobs;

namespace ATStool.Services.Interfaces
{
    public interface IJobFolderService
    {
        Task<JobFolderListResponse> GetJobsAsync(int page, int limit);
        Task<JobFolderResponse?> GetJobByIdAsync(Guid id);
        Task<bool> UpdateFolderStatusAsync(Guid id, string status);
    }
}