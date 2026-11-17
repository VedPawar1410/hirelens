using ATStool.DTOs.Auth;

namespace ATStool.Services.Interfaces
{
    public record LoginResult(string Id, string Username, string FullName, string Email, string UserType, string Token);
    public record RegisterResult(string Id, string Username, string Email, string UserType);

    public record InterviewerDto(string Id, string Username, string FullName, string Email);

    public interface IAuthService
    {
        // Returns RegisterResult on success. Throws ArgumentException if userType is unknown
        // or if Identity returns errors (e.g. duplicate username).
        Task<RegisterResult> RegisterAsync(RegisterDto dto);

        // Returns LoginResult on success. Throws UnauthorizedAccessException for bad credentials.
        Task<LoginResult> LoginAsync(LoginDto dto);

        void Logout();

        Task<List<InterviewerDto>> GetInterviewersAsync();
    }
}
