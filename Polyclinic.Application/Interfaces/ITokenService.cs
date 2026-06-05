using Polyclinic.Application.DTOs.Auth;
using Polyclinic.Domain.Entities;

namespace Polyclinic.Application.Interfaces
{
    public interface ITokenService
    {
        Task<AuthResponseDto> GenerateAuthResponseAsync(User user, bool rememberMe = false);
        string GenerateJwtToken(User user);
        Task<string> GenerateRefreshTokenAsync(User user, bool rememberMe = false);
    }
}
