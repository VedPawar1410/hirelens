using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ATStool.Services.Interfaces;
using ATStool.Services;
using ATStool.Models;
using ATStool.DTOs.Jobs;

namespace ATStool.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    [Authorize]
    public class JobFolderController : ControllerBase
    {
        private readonly IJobFolderService _jobFolderService;

        public JobFolderController(IJobFolderService jobFolderService)
        {
            _jobFolderService = jobFolderService;
        }

        // GET api/jobs?page=1&limit=20
        [HttpGet]
        public async Task<IActionResult> GetJobs(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            if (page < 1 || limit < 1)
                return BadRequest(new { message = "Page and limit must be greater than 0." });

            var result = await _jobFolderService.GetJobsAsync(page, limit);
            //return Ok(ApiResponse<JobFolderListResponse>.Ok("Jobs successfully fetched", result));
            return Ok(result);

        }

        // GET api/jobs/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetJob(Guid id)
        {
            var result = await _jobFolderService.GetJobByIdAsync(id);

            if (result == null)
                return NotFound(new { message = $"Job folder {id} not found." });

            return Ok(result);
        }

        // PATCH api/jobs/{id}/status
        [HttpPatch("{id:guid}/status")]
        public async Task<IActionResult> PatchFolderStatus(Guid id, [FromBody] PatchFolderStatusRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FolderStatus))
                return BadRequest(new { message = "folderStatus is required." });

            try
            {
                var found = await _jobFolderService.UpdateFolderStatusAsync(id, request.FolderStatus.ToLower());
                if (!found)
                    return NotFound(new { message = $"Job folder {id} not found." });

                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}