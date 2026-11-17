using Microsoft.AspNetCore.Mvc;
using ATStool.Models;
using ATStool.DTOs.Auth;
using ATStool.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ATStool.Constants;

namespace ATStool.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // Only an admin may create accounts. The first admin is seeded at startup
        // from configuration (Seed:AdminPassword) - see SeedUsers in Program.cs.
        [HttpPost("register")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.Fail("Validation failed.", errors));
            }

            var result = await _authService.RegisterAsync(dto);
            return Ok(ApiResponse<object>.Ok("User registered successfully.", new
            {
                id = result.Id,
                username = result.Username,
                email = result.Email,
                userType = result.UserType
            }));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.Fail("Validation failed.", errors));
            }

            var result = await _authService.LoginAsync(dto);
            // The JWT travels only in the ATSAuth HttpOnly cookie (set by TokenService) —
            // never in the body, so XSS cannot exfiltrate it from script-readable storage.
            return Ok(ApiResponse<object>.Ok("Login successful.", new
            {
                user = new
                {
                    id = result.Id,
                    username = result.Username,
                    name = result.FullName,
                    role = result.UserType
                }
            }));
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            return Ok(ApiResponse<object>.Ok("Current user.", new
            {
                id = User.FindFirstValue(ClaimTypes.NameIdentifier),
                username = User.FindFirstValue(ClaimTypes.Name),
                name = User.FindFirstValue(ClaimTypes.GivenName),
                role = User.FindFirstValue(ClaimTypes.Role)
            }));
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            _authService.Logout();
            return Ok(ApiResponse<string>.Ok("Logged out successfully.", null));
        }

        [HttpGet("interviewers")]
        [Authorize]
        public async Task<IActionResult> GetInterviewers()
        {
            var interviewers = await _authService.GetInterviewersAsync();
            return Ok(ApiResponse<object>.Ok("Interviewers fetched.", interviewers));
        }
    }
}
