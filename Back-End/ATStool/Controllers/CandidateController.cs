using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ATStool.DTOs.Candidates;
using ATStool.Services.Interfaces;
using System.Security.Claims;

namespace ATStool.Controllers
{
    [ApiController]
    [Route("api/candidates")]
    [Authorize]
    public class CandidateController : ControllerBase
    {
        private readonly ICandidateService _candidateService;
        private readonly ISseService _sseService;
        private readonly ICandidateNoteService _noteService;

        public CandidateController(ICandidateService candidateService, ISseService sseService, ICandidateNoteService noteService)
        {
            _candidateService = candidateService;
            _sseService = sseService;
            _noteService = noteService;
        }

        // GET api/candidates?page=1&limit=50&status=&search=&jobId=&sortBy=matchScore&sortDir=desc&minScore=
        // Returns: { candidates, total, page, limit }
        [HttpGet]
        public async Task<IActionResult> GetCandidates(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] string? jobId = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortDir = null,
            [FromQuery] int? minScore = null)
        {
            var result = await _candidateService.GetCandidatesAsync(page, limit, status, search, jobId, sortBy, sortDir, minScore);
            return Ok(result);
        }

        // GET api/candidates/{candidateId}/{jobId}/detail
        // Returns full candidate info + both PDFs as base64 in one response
        [HttpGet("{candidateId}/{jobId}/detail")]
        public async Task<IActionResult> GetCandidateDetail(
            string candidateId,
            string jobId,
            [FromQuery] bool includeJobDescription = true)
        {
            var result = await _candidateService.GetCandidateDetailAsync(candidateId, jobId, includeJobDescription);
            return Ok(result);
        }

        // PATCH api/candidates/{candidateId}/stage?jobId= — advance to next pipeline stage
        // Returns: { status }
        [HttpPatch("{candidateId}/stage")]
        public async Task<IActionResult> MoveToNextStage(string candidateId, [FromQuery] string jobId)
        {
            var newStatus = await _candidateService.MoveToNextStageAsync(candidateId, jobId);
            return Ok(new { status = newStatus });
        }

        // PATCH api/candidates/{candidateId}/shortlist?jobId= — directly shortlist
        // Returns: { status }
        [HttpPatch("{candidateId}/shortlist")]
        public async Task<IActionResult> Shortlist(string candidateId, [FromQuery] string jobId)
        {
            var newStatus = await _candidateService.ShortlistAsync(candidateId, jobId);
            return Ok(new { status = newStatus });
        }

        // PATCH api/candidates/{candidateId}/prev-stage?jobId= — move back one pipeline stage
        // Returns: { status }
        [HttpPatch("{candidateId}/prev-stage")]
        public async Task<IActionResult> MoveToPreviousStage(string candidateId, [FromQuery] string jobId)
        {
            var newStatus = await _candidateService.MoveToPreviousStageAsync(candidateId, jobId);
            return Ok(new { status = newStatus });
        }

        // PATCH api/candidates/{candidateId}/reject?jobId= — reject a candidate
        // Returns: { status }
        [HttpPatch("{candidateId}/reject")]
        public async Task<IActionResult> Reject(string candidateId, [FromQuery] string jobId)
        {
            var newStatus = await _candidateService.RejectAsync(candidateId, jobId);
            return Ok(new { status = newStatus });
        }

        // GET api/candidates/counts — per-stage totals + top-match count
        [HttpGet("counts")]
        public async Task<IActionResult> GetStageCounts()
        {
            var result = await _candidateService.GetStageCountsAsync();
            return Ok(result);
        }

        // GET api/candidates/job-stage-counts?jobId= — per-stage counts for a single job folder
        [HttpGet("job-stage-counts")]
        public async Task<IActionResult> GetJobStageCounts([FromQuery] string jobId)
        {
            var result = await _candidateService.GetJobStageCountsAsync(jobId);
            return Ok(result);
        }

        // GET api/candidates/{candidateId}/notes
        [HttpGet("{candidateId}/notes")]
        public async Task<IActionResult> GetNotes(string candidateId)
        {
            var notes = await _noteService.GetNotesAsync(candidateId);
            return Ok(notes);
        }

        // POST api/candidates/{candidateId}/notes
        [HttpPost("{candidateId}/notes")]
        public async Task<IActionResult> AddNote(string candidateId, [FromBody] AddNoteDto dto)
        {
            var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var authorName = User.FindFirstValue(ClaimTypes.GivenName);
            if (string.IsNullOrEmpty(authorId) || string.IsNullOrEmpty(authorName))
                return Unauthorized();
            if (string.IsNullOrWhiteSpace(dto.Text))
                return BadRequest(new { message = "Note text cannot be empty." });

            var note = await _noteService.AddNoteAsync(candidateId, authorId, authorName, dto.Text.Trim());
            return StatusCode(201, note);
        }

        // DELETE api/candidates/{candidateId}/notes/{noteId}
        [HttpDelete("{candidateId}/notes/{noteId:guid}")]
        public async Task<IActionResult> DeleteNote(string candidateId, Guid noteId)
        {
            var requestingUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(requestingUserId))
                return Unauthorized();

            try
            {
                await _noteService.DeleteNoteAsync(noteId, requestingUserId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // GET api/candidates/stream?jobId=...
        // Persistent SSE connection. Immediately pushes current candidates on connect,
        // then receives live updates from AtsScoreWorker as each scoring chunk completes.
        [HttpGet("stream")]
        public async Task StreamCandidates([FromQuery] string jobId)
        {
            Response.Headers["Content-Type"] = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["Connection"] = "keep-alive";
            Response.Headers["X-Accel-Buffering"] = "no";
            await Response.Body.FlushAsync();

            _sseService.AddConnection(jobId, Response);

            // Send current candidate state immediately so the frontend renders on connect
            var current = await _candidateService.GetCandidatesAsync(
                page: 1, limit: 1000, status: null, search: null, jobId: jobId);

            if (current.Candidates.Count > 0)
                await _sseService.PushCandidatesAsync(jobId, current.Candidates);

            try
            {
                await Task.Delay(Timeout.Infinite, HttpContext.RequestAborted);
            }
            catch (TaskCanceledException)
            {
                // Normal — client disconnected
            }
            finally
            {
                _sseService.RemoveConnection(jobId, Response);
            }
        }
    }
}
