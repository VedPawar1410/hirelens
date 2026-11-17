using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ATStool.Constants;
using ATStool.DTOs.Interviews;
using ATStool.Services.Interfaces;
using System.Security.Claims;

namespace ATStool.Controllers
{
    [ApiController]
    [Route("api/interviews")]
    [Authorize]
    public class InterviewsController : ControllerBase
    {
        private readonly IInterviewService _service;

        public InterviewsController(IInterviewService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        // GET api/interviews/upcoming?hours=24
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming([FromQuery] int hours = 24)
        {
            var result = await _service.GetUpcomingAsync(hours);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpGet("candidate/{candidateId}")]
        public async Task<IActionResult> GetByCandidate(string candidateId, [FromQuery] string jobId)
        {
            var result = await _service.GetByCandidateIdAsync(candidateId, jobId);
            return Ok(result);
        }

        [HttpGet("job/{jobId:guid}")]
        public async Task<IActionResult> GetByJob(Guid jobId)
        {
            var result = await _service.GetByJobIdAsync(jobId);
            return Ok(result);
        }

        [HttpGet("interviewer/{interviewerId}")]
        public async Task<IActionResult> GetByInterviewer(string interviewerId)
        {
            var result = await _service.GetByInterviewerIdWithDetailsAsync(interviewerId);
            return Ok(result);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var result = await _service.GetByStatusAsync(status);
            return Ok(result);
        }

        [HttpPost("schedule-round")]
        public async Task<IActionResult> Create([FromBody] CreateInterviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var scheduledByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(scheduledByUserId))
                return Unauthorized();

            try
            {
                var (interview, emailResult) = await _service.CreateAsync(dto, scheduledByUserId);

                if (!emailResult.Success)
                {
                    return StatusCode(502, new
                    {
                        message = "Interview was created but email notification failed.",
                        emailError = emailResult.Message,
                        interview
                    });
                }

                return CreatedAtAction(nameof(GetById), new { id = interview.InterviewId }, new
                {
                    message = "Interview created and email notification sent successfully.",
                    data = emailResult.Data,
                    interview
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateInterviewDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _service.UpdateAsync(id, dto);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPost("{id}/feedback")]
        public async Task<IActionResult> SubmitFeedback(string id, [FromBody] SubmitFeedbackDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _service.SubmitFeedbackAsync(id, dto);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpPatch("{id}/reschedule")]
        public async Task<IActionResult> Reschedule(string id, [FromBody] RescheduleInterviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (interview, emailResult) = await _service.RescheduleAsync(id, dto);

            if (interview is null)
                return NotFound();

            if (!emailResult.Success)
            {
                return StatusCode(502, new
                {
                    message = "Interview rescheduled but email notification failed.",
                    emailError = emailResult.Message,
                    interview
                });
            }

            return Ok(new
            {
                message = "Interview rescheduled and email notification sent successfully.",
                data = emailResult.Data,
                interview
            });
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            var (success, emailResult) = await _service.CancelAsync(id);

            if (!success)
                return NotFound();

            if (!emailResult.Success)
            {
                return StatusCode(502, new
                {
                    message = "Interview cancelled but email notification failed.",
                    emailError = emailResult.Message
                });
            }

            return Ok(new
            {
                message = "Interview cancelled and email notification sent successfully.",
                data = emailResult.Data
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _service.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }

        // Controller
        [HttpPatch("{id}/no-show")]
        public async Task<IActionResult> MarkNoShow(string id)
        {
            var result = await _service.MarkNoShowAsync(id);
            return result is null ? NotFound() : Ok(result);
        }

        // POST api/interviews/skip-round — mark a configured round as skipped for a candidate on a job.
        [HttpPost("skip-round")]
        [Authorize(Roles = AppRoles.Recruitment)]
        public async Task<IActionResult> SkipRound([FromBody] SkipRoundDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var skipped = await _service.SkipRoundAsync(dto.CandidateId, dto.JobId, dto.Round, userId);
            return Ok(new { skippedRounds = skipped });
        }

        // POST api/interviews/unskip-round — undo a skipped round.
        [HttpPost("unskip-round")]
        [Authorize(Roles = AppRoles.Recruitment)]
        public async Task<IActionResult> UnskipRound([FromBody] SkipRoundDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var skipped = await _service.UnskipRoundAsync(dto.CandidateId, dto.JobId, dto.Round);
            return Ok(new { skippedRounds = skipped });
        }
    }
}
