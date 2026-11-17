using ATStool.Models;

namespace ATStool.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateTokenString(User user, string userType);
        string GenerateAndSetToken(User user, string userType);
        void ClearTokenCookie();
    }
}
