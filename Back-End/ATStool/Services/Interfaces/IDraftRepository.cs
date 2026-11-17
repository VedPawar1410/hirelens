using ATStool.Models;

namespace ATStool.Services.Interfaces
{
    public interface IDraftRepository
    {
        
        Task<(List<Job> Jobs, int Total)> GetFinalizedJobsAsync(int page, int limit);
        Task<Job?> GetFinalizedJobByIdAsync(Guid id);
        Task<bool> UpdateFolderStatusAsync(Guid id, string status);
    }
}