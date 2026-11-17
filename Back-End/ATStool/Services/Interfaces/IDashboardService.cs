using ATStool.DTOs.Dashboard;

namespace ATStool.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetStatsAsync();
        Task<List<ApplicationVolumeDayDto>> GetApplicationVolumeAsync(string period);
        Task<List<RecentJobFolderDto>> GetRecentJobFoldersAsync(int limit);
        Task<PipelineFunnelDto> GetPipelineFunnelAsync();
        Task<List<AttentionItemDto>> GetAttentionItemsAsync();
    }
}
