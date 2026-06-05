using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Polyclinic.Application.DTOs.Auth;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly PolyclinicDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IAuditService _auditService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;
        private readonly IConfiguration _configuration;

        public AuthService(PolyclinicDbContext context, ITokenService tokenService, IAuditService auditService, IEmailService emailService, ILogger<AuthService> logger, IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _auditService = auditService;
            _emailService = emailService;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existing != null)
                throw new InvalidOperationException("Email-ul este deja folosit");

            var verificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
            // URL safe
            verificationToken = verificationToken.Replace("+", "-").Replace("/", "_").Replace("=", "");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Phone = dto.PhoneNumber ?? "",
                Role = "patient",
                IsActive = true,
                EmailVerified = false,
                EmailVerificationToken = verificationToken,
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // trimite email verificare
            try
            {
                await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eroare la trimiterea email-ului de verificare");
            }

            return await _tokenService.GenerateAuthResponseAsync(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new BadRequestException("Email sau parolă incorecte");

            await _auditService.LogAsync(user.Id, "LOGIN", "User", user.Id);

            return await _tokenService.GenerateAuthResponseAsync(user, dto.RememberMe);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var token = await _context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshToken && !r.IsRevoked);

            if (token == null || token.ExpiresAt < DateTime.UtcNow)
                throw new BadRequestException("Token invalid sau expirat");

            token.IsRevoked = true;
            token.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await _tokenService.GenerateAuthResponseAsync(token.User);
        }

        public async Task RevokeTokenAsync(string refreshToken)
        {
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (token == null)
                throw new NotFoundException("Token negăsit");

            token.IsRevoked = true;
            token.RevokedReason = "Manual revocation";
            token.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(token.UserId, "LOGOUT", "User", token.UserId);
        }

        public async Task<AuthResponseDto> SocialLoginAsync(SocialLoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Role = "patient",
                    IsActive = true,
                    Phone = string.Empty,
                    EmailVerified = true,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            return await _tokenService.GenerateAuthResponseAsync(user);
        }
        public async Task<bool> VerifyEmailAsync(string token)
        {
            _logger.LogInformation("Verifying token: {Token}", token);

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.EmailVerificationToken == token &&
                u.EmailVerificationTokenExpiry > DateTime.UtcNow);

            _logger.LogInformation("User found: {Found}", user != null);

            if (user == null) return false;

            user.EmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            // daca e migrare walk-in, trimitem parola
            if (!string.IsNullOrEmpty(user.TemporaryPassword))
            {
                try
                {
                    await _emailService.SendWalkInPasswordEmailAsync(user.Email, user.FirstName, user.TemporaryPassword);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la trimiterea parolei temporare");
                }
                user.TemporaryPassword = null;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        public async Task ResendVerificationEmailAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return;
            if (user.EmailVerified) return;

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
            user.EmailVerificationToken = token;
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, token);
        }
        public async Task ForgotPasswordAsync(string email)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

            // nu revedam daca userul exista sau nu - securitate
            if (user == null) return;

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
            user.PasswordResetToken = token;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";
            var resetUrl = $"{frontendUrl}/reset-password?token={token}";

            try
            {
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.FirstName, resetUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eroare la trimiterea email-ului de resetare parolă");
            }
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token &&
                u.PasswordResetTokenExpiry > DateTime.UtcNow);

            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
