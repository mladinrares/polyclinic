using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.DTOs.InsuranceCard;
using Polyclinic.Application.DTOs.Patients;
using Polyclinic.Application.DTOs.Users;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly PolyclinicDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public UserService(PolyclinicDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<UserProfileDto> GetProfileAsync(Guid userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new NotFoundException("Utilizatorul nu a fost găsit");

            return new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                Address = user.Address,
                City = user.City,
                County = user.County,
                DateOfBirth = user.DateOfBirth.HasValue ? DateOnly.FromDateTime(user.DateOfBirth.Value) : null,
                Gender = user.Gender,
                Role = user.Role,
                CNP = user.CNP,
                EmailVerified = user.EmailVerified,
                ProfilePictureUrl = user.ProfilePictureUrl
            };
        }

        public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new NotFoundException("Utilizatorul nu a fost găsit");

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Phone = dto.Phone ?? string.Empty;
            user.Address = dto.Address;
            user.City = dto.City;
            user.County = dto.County;
            user.DateOfBirth = dto.DateOfBirth.HasValue ? dto.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue) : null;
            user.Gender = dto.Gender;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetProfileAsync(userId);
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new NotFoundException("Utilizatorul nu a fost găsit");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new BadRequestException("Parola curentă este incorectă");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }


        public async Task<List<InsuranceCardDto>> GetInsuranceCardsAsync(Guid userId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return await _context.InsuranceCards
                .Where(c => c.PatientId == userId && c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new InsuranceCardDto
                {
                    Id = c.Id,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    InsuredCode = c.InsuredCode,
                    DocumentNumber = c.DocumentNumber,
                    ExpiryDate = c.ExpiryDate,
                    IsActive = c.IsActive,
                    IsVerified = c.IsVerified,
                    IsValid = c.IsActive && c.ExpiryDate >= today
                })
                .ToListAsync();
        }

        public async Task<InsuranceCardDto> AddInsuranceCardAsync(Guid userId, AddInsuranceCardDto dto)
        {
            var existingActive = await _context.InsuranceCards
                .AnyAsync(c => c.PatientId == userId && c.IsActive);

            if (existingActive)
                throw new ConflictException("Ai deja un card de sănătate activ. Șterge-l înainte să adaugi altul.");

            var card = new InsuranceCard
            {
                Id = Guid.NewGuid(),
                PatientId = userId,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                InsuredCode = dto.InsuredCode,
                DocumentNumber = dto.DocumentNumber,
                ExpiryDate = dto.ExpiryDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.InsuranceCards.Add(card);
            await _context.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return new InsuranceCardDto
            {
                Id = card.Id,
                FirstName = card.FirstName,
                LastName = card.LastName,
                InsuredCode = card.InsuredCode,
                DocumentNumber = card.DocumentNumber,
                ExpiryDate = card.ExpiryDate,
                IsActive = card.IsActive,
                IsValid = card.IsActive && card.ExpiryDate >= today
            };
        }

        public async Task RemoveInsuranceCardAsync(Guid cardId, Guid userId)
        {
            var card = await _context.InsuranceCards
                .FirstOrDefaultAsync(c => c.Id == cardId && c.PatientId == userId)
                ?? throw new NotFoundException("Cardul nu a fost găsit");

            card.IsActive = false;
            card.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<InsuranceCardDto?> GetValidInsuranceCardAsync(Guid userId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var card = await _context.InsuranceCards
                .FirstOrDefaultAsync(c => 
                c.PatientId == userId &&
                c.IsVerified &&
                c.IsActive &&
                c.ExpiryDate >= today);

            if (card == null) return null;

            return new InsuranceCardDto
            {
                Id = card.Id,
                FirstName = card.FirstName,
                LastName = card.LastName,
                InsuredCode = card.InsuredCode,
                DocumentNumber = card.DocumentNumber,
                ExpiryDate = card.ExpiryDate,
                IsActive = card.IsActive,
                IsValid = true,
                IsVerified = card.IsVerified
            };
        }

        public async Task<PagedResultDto<PatientInsuranceDto>> GetPatientsWithCardsAsync(string? searchName, int page, int pageSize)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var query = _context.InsuranceCards
                .Include(c => c.Patient)
                .Where(c => c.IsActive);

            if (!string.IsNullOrEmpty(searchName))
            {
                var search = searchName.ToLower();
                query = query.Where(c =>
                    c.Patient.FirstName.ToLower().Contains(search) ||
                    c.Patient.LastName.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            var cards = await query
                .OrderBy(c => c.IsVerified)
                .ThenByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new PatientInsuranceDto
                {
                    PatientId = c.PatientId!.Value,
                    PatientName = $"{c.Patient.FirstName} {c.Patient.LastName}",
                    PatientEmail = c.Patient.Email,
                    CardId = c.Id,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    InsuredCode = c.InsuredCode,
                    DocumentNumber = c.DocumentNumber,
                    ExpiryDate = c.ExpiryDate,
                    IsVerified = c.IsVerified,
                    IsValid = c.IsActive && c.ExpiryDate >= today
                })
                .ToListAsync();

            return new PagedResultDto<PatientInsuranceDto>
            {
                Items = cards,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task ValidateInsuranceCardAsync(Guid cardId)
        {
            var card = await _context.InsuranceCards.FirstOrDefaultAsync(c => c.Id == cardId)
                ?? throw new NotFoundException("Cardul nu a fost găsit");

            card.IsVerified = true;
            card.VerifiedAt = DateTime.UtcNow;
            card.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task InvalidateInsuranceCardAsync(Guid cardId)
        {
            var card = await _context.InsuranceCards.FirstOrDefaultAsync(c => c.Id == cardId)
                ?? throw new NotFoundException("Cardul nu a fost găsit");

            card.IsVerified = false;
            card.VerifiedAt = null;
            card.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        public async Task UpdateProfilePictureAsync(Guid userId, string profilePictureUrl)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new NotFoundException("Utilizatorul nu a fost găsit");

            
            if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
            {
                var oldPath = Path.Combine(
                    Directory.GetCurrentDirectory(), "wwwroot",
                    user.ProfilePictureUrl.TrimStart('/'));
                if (File.Exists(oldPath))
                    File.Delete(oldPath);
            }

            user.ProfilePictureUrl = profilePictureUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        public async Task<PatientLookupDto?> GetPatientByEmailAsync(string email)
        {
            var patient = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive && u.Role == "patient");

            if (patient == null) return null;

            return new PatientLookupDto
            {
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                Email = patient.Email,
                EmailVerified = patient.EmailVerified,
            };
        }

        public async Task<PagedResultDto<PatientDto>> GetAllPatientsAsync(string? search, int page, int pageSize, bool showInactive = false)
        {
            var query = _context.Users.Where(u => u.Role == "patient").AsQueryable();
            if (!showInactive) query = query.Where(u => u.IsActive);

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(u =>
                    (u.FirstName + " " + u.LastName).ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    (u.Phone != null && u.Phone.Contains(s)));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new PatientDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    Phone = u.Phone,
                    Address = u.Address,
                    City = u.City,
                    County = u.County,
                    EmailVerified = u.EmailVerified,
                    IsActive = u.IsActive,
                    CNP = u.CNP,
                    CreatedAt = u.CreatedAt,
                })
                .ToListAsync();

            return new PagedResultDto<PatientDto>
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task UpdatePatientAsync(Guid id, UpdatePatientDto dto)
        {
            var user = await _context.Users.FindAsync(id)
                ?? throw new InvalidOperationException("Pacientul nu a fost găsit");

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Phone = dto.Phone ?? user.Phone;
            user.Address = dto.Address;
            user.City = dto.City;
            user.CNP = dto.CNP;
            user.County = dto.County;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeactivatePatientAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id)
                ?? throw new InvalidOperationException("Pacientul nu a fost găsit");

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<PatientDto> CreatePatientAsync(CreatePatientDto dto)
        {
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existing != null)
                throw new InvalidOperationException("Există deja un cont cu acest email");

            var password = GenerateTemporaryPassword();
            var verificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Phone = dto.Phone ?? "",
                Address = dto.Address,
                City = dto.City,
                County = dto.County,
                CNP = dto.CNP,
                Role = "patient",
                IsActive = true,
                EmailVerified = false,
                EmailVerificationToken = verificationToken,
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                TemporaryPassword = password,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var verifyUrl = $"{frontendUrl}/verify-email?token={verificationToken}";
            await _emailService.SendWalkInMigrationEmailAsync(dto.Email, dto.FirstName, verifyUrl);

            return new PatientDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.Phone,
                EmailVerified = user.EmailVerified,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
            };
        }

        public async Task ReactivatePatientAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id)
                ?? throw new InvalidOperationException("Pacientul nu a fost găsit");
            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteOwnAccountAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new InvalidOperationException("Utilizatorul nu a fost găsit");
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task ResendVerificationEmailAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new InvalidOperationException("Utilizatorul nu a fost găsit");

            if (user.EmailVerified)
                throw new InvalidOperationException("Email-ul este deja verificat");

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
            user.EmailVerificationToken = token;
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";
            var verifyUrl = $"{frontendUrl}/verify-email?token={token}";
            await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, token);
        }

        private static string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 12).Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
