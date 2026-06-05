using Polyclinic.Application.DTOs.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task RevokeTokenAsync(string refreshToken);
        Task<AuthResponseDto> SocialLoginAsync(SocialLoginDto dto);
        Task<bool> VerifyEmailAsync(string token);
        Task ResendVerificationEmailAsync(string email);
        Task ForgotPasswordAsync(string email);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
    }
}
