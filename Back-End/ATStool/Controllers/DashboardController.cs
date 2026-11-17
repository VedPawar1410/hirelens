using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ATStool.Services.Interfaces;

namespace ATStool.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        // GET api/dashboard/stats
        // Returns: { active_jobs, total_applications, ai_matches, interviews_pending }
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _dashboardService.GetStatsAsync();
            return Ok(stats);
        }

        // GET api/dashboard/application-volume?period=7d|30d|90d
        // Returns: { data: [{ day, apps }] }
        [HttpGet("application-volume")]
        public async Task<IActionResult> GetApplicationVolume([FromQuery] string period = "7d")
        {
            var data = await _dashboardService.GetApplicationVolumeAsync(period);
            return Ok(new { data });
        }

        // GET api/dashboard/recent-job-folders?limit=3
        // Returns: { folders: [{ id, job_title, department, location, candidates_count, status, created_at }] }
        [HttpGet("recent-job-folders")]
        public async Task<IActionResult> GetRecentJobFolders([FromQuery] int limit = 3)
        {
            var folders = await _dashboardService.GetRecentJobFoldersAsync(limit);
            return Ok(new { folders });
        }

        // GET api/dashboard/pipeline-funnel
        // Returns: { stages: [{ stage, label, count }], selectedRate, avgCycleDays }
        [HttpGet("pipeline-funnel")]
        public async Task<IActionResult> GetPipelineFunnel()
        {
            var funnel = await _dashboardService.GetPipelineFunnelAsync();
            return Ok(funnel);
        }

        // GET api/dashboard/attention-items
        // Returns: [{ type, count, title, subtitle, actionPath }]
        [HttpGet("attention-items")]
        public async Task<IActionResult> GetAttentionItems()
        {
            var items = await _dashboardService.GetAttentionItemsAsync();
            return Ok(items);
        }
    }
}
