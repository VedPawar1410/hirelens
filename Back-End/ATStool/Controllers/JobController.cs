using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ATStool.DTOs.Jobs;
using ATStool.Models;
using ATStool.Services.Interfaces;
using ATStool.Constants;

namespace ATStool.Controllers
{
    [ApiController]   
    [Route("api/drafts")]
    [Authorize]
    public class JobController : ControllerBase
    {
        private readonly IJobService _jobService;

        public JobController(IJobService jobService)
        {
            _jobService = jobService;
        }

        // GET api/drafts?createdBy=username  (recruitment portal)
        // GET api/drafts?assignedTo=username (interviewer portal)
        [HttpGet]
        public async Task<IActionResult> GetDrafts([FromQuery] string? createdBy, [FromQuery] string? assignedTo)
        {
            var jobs = await _jobService.GetDraftsAsync(createdBy, assignedTo);
            return Ok(ApiResponse<object>.Ok("Drafts fetched successfully.", jobs));
        }

        // GET api/drafts/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetJobById(Guid id)
        {
            var job = await _jobService.GetDraftByIdAsync(id);
            return Ok(ApiResponse<object>.Ok("Draft fetched successfully.", job));
        }

        // POST api/drafts — create draft + trigger AI JD generation
        [HttpPost]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobDto dto)
        {
            if (!ModelState.IsValid)
            {
                var fields = ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .ToDictionary(kv => kv.Key, kv => kv.Value!.Errors.First().ErrorMessage);
                return BadRequest(ApiResponse<string>.FailWithFields("Validation failed.", fields));
            }

            var createdBy = User.Identity?.Name ?? "Unknown";
            var job = await _jobService.CreateJobAsync(dto, createdBy);
            return CreatedAtAction(nameof(GetJobById), new { id = job.Id },
                ApiResponse<object>.Ok("Draft created successfully.", job));
        }

        // PATCH api/drafts/{id} — update draft fields (recruiter edits before assign)
        [HttpPatch("{id:guid}")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> UpdateJob(Guid id, [FromBody] PatchJobDto dto)
        {
            if (!ModelState.IsValid)
            {
                var fields = ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .ToDictionary(kv => kv.Key, kv => kv.Value!.Errors.First().ErrorMessage);
                return BadRequest(ApiResponse<string>.FailWithFields("Validation failed.", fields));
            }

            var job = await _jobService.UpdateJobAsync(id, dto);
            return Ok(ApiResponse<object>.Ok("Draft updated successfully.", job));
        }

        // PUT api/drafts/{id}/interview-rounds — replace the job's configured interview rounds
        [HttpPut("{id:guid}/interview-rounds")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> UpdateInterviewRounds(Guid id, [FromBody] List<JobRound> rounds)
        {
            var job = await _jobService.UpdateInterviewRoundsAsync(id, rounds ?? []);
            return Ok(ApiResponse<object>.Ok("Interview rounds updated successfully.", job));
        }

        // PATCH api/drafts/{id}/assign — assign interviewers, status → "assigned"
        [HttpPatch("{id:guid}/assign")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> AssignDraft(Guid id, [FromBody] AssignDraftDto dto)
        {
            var job = await _jobService.AssignDraftAsync(id, dto.AssignedTo);
            return Ok(ApiResponse<object>.Ok("Draft assigned successfully.", job));
        }

        // PATCH api/drafts/{id}/role-description — interviewer saves role description edits
        [HttpPatch("{id:guid}/role-description")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment + "," + AppRoles.Interviewer)]
        public async Task<IActionResult> UpdateRoleDescription(Guid id, [FromBody] RoleDescriptionDto dto)
        {
            var job = await _jobService.UpdateRoleDescriptionAsync(id, dto.RoleDescription);
            return Ok(ApiResponse<object>.Ok("Role description updated successfully.", job));
        }

        // PATCH api/drafts/{id}/submit — interviewer submits, status → "returned"
        [HttpPatch("{id:guid}/submit")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment + "," + AppRoles.Interviewer)]
        public async Task<IActionResult> SubmitDraft(Guid id)
        {
            var job = await _jobService.SubmitDraftAsync(id);
            return Ok(ApiResponse<object>.Ok("Draft submitted successfully.", job));
        }

        // POST api/drafts/{id}/generate — (re)generate JD via Python AI
        [HttpPost("{id:guid}/generate")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> GeneratePreview(Guid id)
        {
            var previewJd = await _jobService.GeneratePreviewAsync(id);
            return Ok(ApiResponse<object>.Ok("JD generated successfully.", new { previewJD = previewJd }));
        }

        // POST api/drafts/{id}/finalize — recruiter approves edited JD, status → "finalized"
        [HttpPost("{id:guid}/finalize")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> FinalizeDraft(Guid id, [FromBody] FinalizeDraftDto dto)
        {
            if (!ModelState.IsValid)
            {
                var fields = ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .ToDictionary(kv => kv.Key, kv => kv.Value!.Errors.First().ErrorMessage);
                return BadRequest(ApiResponse<string>.FailWithFields("Validation failed.", fields));
            }

            var job = await _jobService.FinalizeDraftAsync(id, dto);
            return Ok(ApiResponse<object>.Ok("Draft finalized successfully.", job));
        }

        // PATCH api/drafts/{id}/dismiss — remove a user from assigned_to
        [HttpPatch("{id:guid}/dismiss")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment + "," + AppRoles.Interviewer)]
        public async Task<IActionResult> DismissDraft(Guid id, [FromBody] DismissDraftDto dto)
        {
            var job = await _jobService.DismissDraftAsync(id, dto.Username);
            return Ok(ApiResponse<object>.Ok("Draft dismissed successfully.", job));
        }

        // GET api/drafts/{id}/pdf — proxy to Python /download-pdf, stream binary PDF
        [HttpGet("{id:guid}/pdf")]
        public async Task<IActionResult> DownloadPdf(Guid id)
        {
            var (bytes, filename) = await _jobService.DownloadPdfAsync(id);
            return File(bytes, "application/pdf", filename);
        }

        // DELETE api/drafts/{id}
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Recruitment)]
        public async Task<IActionResult> DeleteJob(Guid id)
        {
            await _jobService.DeleteJobAsync(id);
            return Ok(ApiResponse<string?>.Ok("Draft deleted successfully.", null));
        }

        // GET api/jobs/{jobId}/description
        // Streams job description PDF from blob storage
        [HttpGet("{jobId:guid}/description")]
        public async Task<IActionResult> GetJobDescription(Guid jobId)
        {
            var (fileBytes, contentType, fileName) = await _jobService.GetJobDescriptionAsync(jobId);
            return File(fileBytes, contentType, fileName);
        }
    }
}
