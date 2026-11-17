using ATStool.Constants;
using ATStool.Models;
using ATStool.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ATStool.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _env;

        public TokenService(IConfiguration config, IHttpContextAccessor httpContextAccessor, IWebHostEnvironment env)
        {
            _config = config;
            _httpContextAccessor = httpContextAccessor;
            _env = env;
        }

        public string GenerateTokenString(User user, string userType)
            => GenerateToken(user, AppRoles.Normalize(userType));

        public string GenerateAndSetToken(User user, string userType)
        {
            var token = GenerateToken(user, AppRoles.Normalize(userType));
            SetTokenCookie(token);
            return token;
        }

        public void ClearTokenCookie()
        {
            _httpContextAccessor.HttpContext?.Response.Cookies.Delete("ATSAuth");
        }

        private string GenerateToken(User user, string userType)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email,          user.Email!),
                new Claim(ClaimTypes.Name,           user.UserName!),
                new Claim(ClaimTypes.GivenName,      user.FullName!),
                new Claim(ClaimTypes.Role,           userType)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_config.GetValue<int>("Jwt:ExpiryHours", 8)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private void SetTokenCookie(string token)
        {
            _httpContextAccessor.HttpContext?.Response.Cookies.Append("ATSAuth", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = _env.IsProduction(),
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddHours(8)
            });
        }
    }
}