using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using ATStool.Data;
using ATStool.Models;
using ATStool.DTOs;
using ATStool.Services.Interfaces;

namespace ATStool.Controllers
{
    [ApiController]
    [Route("api/resumes")]
    [Authorize]
    public class ResumeController : ControllerBase
    {
        private readonly IResumeService _resumeService;

        public ResumeController(IResumeService resumeService)
        {
            _resumeService = resumeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetResumes([FromQuery] string jobId)
        {
            if (string.IsNullOrEmpty(jobId))
                return BadRequest("jobId is required.");

            var resumes = await _resumeService.GetResumesByJobAsync(jobId);
            return Ok(ApiResponse<object>.Ok("Resumes fetched successfully.", resumes));
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
        public async Task<IActionResult> UploadResumes([FromForm] UploadResumeRequest request)
        {
            if (request.Files == null || request.Files.Count == 0 || string.IsNullOrEmpty(request.JobId))
                return BadRequest("files and jobId are required.");

            var result = await _resumeService.ProcessUploadsAsync(request);
            return Ok(result);
        }
    }
}
