using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Auth;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class FacebookAuthProvider : ISocialAuthProvider
    {
        private readonly PolyclinicDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly HttpClient _httpClient;

        public string ProviderName => "facebook";

        public FacebookAuthProvider(PolyclinicDbContext context, ITokenService tokenService, HttpClient httpClient)
        {
            _context = context;
            _tokenService = tokenService;
            _httpClient = httpClient;
        }

        public async Task<AuthResponseDto> LoginAsync(string token)
        {
            var url = $"https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token={token}";
            var response = await _httpClient.GetStringAsync(url);
            var payload = JsonSerializer.Deserialize<FacebookPayload>(response);

            if (payload == null || string.IsNullOrEmpty(payload.Email))
                throw new Exception("Invalid Facebook token");

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.FacebookId == payload.Id || u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = payload.Email,
                    FirstName = payload.FirstName ?? string.Empty,
                    LastName = payload.LastName ?? string.Empty,
                    FacebookId = payload.Id,
                    EmailVerified = true,
                    Role = "patient",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else if (user.FacebookId == null)
            {
                user.FacebookId = payload.Id;
                user.EmailVerified = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return await _tokenService.GenerateAuthResponseAsync(user);
        }
    }

    public class FacebookPayload
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("last_name")]
        public string? LastName { get; set; }
    }
}
