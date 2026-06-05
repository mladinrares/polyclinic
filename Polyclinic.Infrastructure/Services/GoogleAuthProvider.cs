using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Auth;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;

namespace Polyclinic.Infrastructure.Services
{
    public class GoogleAuthProvider : ISocialAuthProvider
    {
        private readonly PolyclinicDbContext _context;
        private readonly ITokenService _tokenService;

        public string ProviderName => "google";

        public GoogleAuthProvider(PolyclinicDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseDto> LoginAsync(string token)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(token);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject || u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = payload.Email,
                    FirstName = payload.GivenName ?? string.Empty,
                    LastName = payload.FamilyName ?? string.Empty,
                    GoogleId = payload.Subject,
                    EmailVerified = true,
                    Role = "patient",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else if (user.GoogleId == null)
            {
                user.GoogleId = payload.Subject;
                user.EmailVerified = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return await _tokenService.GenerateAuthResponseAsync(user);
        }
    }
}
