using Microsoft.AspNetCore.Identity;
using ATStool.Constants;
using ATStool.DTOs.Auth;
using ATStool.Models;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(UserManager<User> userManager, ITokenService tokenService, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _logger = logger;
        }


        public async Task<RegisterResult> RegisterAsync(RegisterDto dto)
        {
            var userType = AppRoles.Normalize(dto.UserType);
            if (!AppRoles.IsKnown(userType))
                throw new ArgumentException($"UserType must be recruitment, interviewer, or Admin. Got: {dto.UserType}");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                UserName = dto.UserName,
                UserType = userType
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Registration failed for {Username}: {Errors}", dto.UserName, errors);
                throw new ArgumentException(errors);
            }

            await _userManager.AddToRoleAsync(user, userType);
            _logger.LogInformation("User {Username} registered as {UserType}", user.UserName, userType);

            return new RegisterResult(user.Id, user.UserName!, user.Email!, userType);
        }

        public async Task<LoginResult> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByNameAsync(dto.UserName);
            if (user == null)
                throw new UnauthorizedAccessException("Invalid username or password.");

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid)
                throw new UnauthorizedAccessException("Invalid username or password.");

            var roles = (await _userManager.GetRolesAsync(user))
                .Select(AppRoles.Normalize)
                .ToList();

            var userType = roles.FirstOrDefault() ?? AppRoles.Interviewer;

            var requestedRole = AppRoles.Normalize(dto.Role);
            if (!string.IsNullOrEmpty(dto.Role) && !roles.Contains(requestedRole))
                throw new UnauthorizedAccessException($"Access denied. You are not authorized as {requestedRole}.");

             
            var token = _tokenService.GenerateAndSetToken(user, userType);
            _logger.LogInformation("User {Username} logged in as {UserType}", user.UserName, userType);

            return new LoginResult(user.Id, user.UserName!, user.FullName!, user.Email!, userType, token);
        }

        public void Logout()
        {
            _tokenService.ClearTokenCookie();
        }

        public async Task<List<InterviewerDto>> GetInterviewersAsync()
        {
            var users = await _userManager.GetUsersInRoleAsync(AppRoles.Interviewer);
            return users
                .Select(u => new InterviewerDto(u.Id, u.UserName ?? string.Empty, u.FullName, u.Email ?? string.Empty))
                .OrderBy(u => u.FullName)
                .ToList();
        }
    }
}
