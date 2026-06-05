using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.DTOs.WalkIn;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System.Security.Cryptography;

namespace Polyclinic.Infrastructure.Services
{
    public class WalkInPatientService : IWalkInPatientService
    {
        private readonly PolyclinicDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public WalkInPatientService(PolyclinicDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<WalkInPatientDto> CreateAsync(CreateWalkInPatientDto dto)
        {
            var existing = await _context.WalkInPatients
                .FirstOrDefaultAsync(w => w.CNP == dto.CNP);
            if (existing != null)
                throw new InvalidOperationException("Există deja un pacient cu acest CNP");

            var walkIn = new WalkInPatient
            {
                Id = Guid.NewGuid(),
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                CNP = dto.CNP,
                Phone = dto.Phone,
                Email = dto.Email,
                Age = dto.Age,
                Address = dto.Address,
                City = dto.City,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.WalkInPatients.Add(walkIn);
            await _context.SaveChangesAsync();
            return ToDto(walkIn);
        }

        public async Task<WalkInPatientDto?> GetByCNPAsync(string cnp)
        {
            var walkIn = await _context.WalkInPatients
                .FirstOrDefaultAsync(w => w.CNP == cnp);
            return walkIn == null ? null : ToDto(walkIn);
        }

        public async Task<WalkInPatientDto> UpdateAsync(Guid id, CreateWalkInPatientDto dto)
        {
            var walkIn = await _context.WalkInPatients.FindAsync(id)
                ?? throw new InvalidOperationException("Pacientul nu a fost găsit");

            walkIn.FirstName = dto.FirstName;
            walkIn.LastName = dto.LastName;
            walkIn.Phone = dto.Phone;
            walkIn.Email = dto.Email;
            walkIn.Age = dto.Age;
            walkIn.Address = dto.Address;
            walkIn.City = dto.City;
            walkIn.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return ToDto(walkIn);
            
        }

        public async Task<PagedResultDto<WalkInPatientDto>> GetAllAsync(string? search, int page, int pageSize, bool showInactive = false)
        {
            var query = _context.WalkInPatients.AsQueryable();
            if (!showInactive) query = query.Where(w => w.IsActive);

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(w =>
                    (w.FirstName + " " + w.LastName).ToLower().Contains(s) ||
                    w.CNP.Contains(s) ||
                    w.Phone.Contains(s));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(w => w.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResultDto<WalkInPatientDto>
            {
                Items = items.Select(ToDto).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
            };
        }

        public async Task<MigrateWalkInResultDto> MigrateToAccountAsync(Guid walkInPatientId)
        {
            var walkIn = await _context.WalkInPatients
                .Include(w => w.Appointments)
                .FirstOrDefaultAsync(w => w.Id == walkInPatientId)
                ?? throw new InvalidOperationException("Pacientul walk-in nu a fost găsit");

            if (string.IsNullOrEmpty(walkIn.Email))
                return new MigrateWalkInResultDto { Success = false, Message = "Pacientul nu are email înregistrat" };

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == walkIn.Email);
            if (existingUser != null)
                return new MigrateWalkInResultDto { Success = false, Message = "Există deja un cont cu acest email" };

            // generam parola temporara
            var password = GenerateTemporaryPassword();
            var verificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";

            // salvam parola in plaintext temporar pe user - o vom trimite dupa verificare
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = walkIn.Email,
                FirstName = walkIn.FirstName,
                LastName = walkIn.LastName,
                Phone = walkIn.Phone,
                CNP = walkIn.CNP,
                Address = walkIn.Address,
                City = walkIn.City,
                County = walkIn.County,
                DateOfBirth = walkIn.Age.HasValue ? DateTime.UtcNow.AddYears(-walkIn.Age.Value) : null,
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

            // migram programarile
            foreach (var appointment in walkIn.Appointments)
            {
                appointment.PatientId = user.Id;
                appointment.WalkInPatientId = null;
                appointment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // trimitem email de confirmare
            var verifyUrl = $"{frontendUrl}/verify-email?token={verificationToken}";
            await _emailService.SendWalkInMigrationEmailAsync(walkIn.Email, walkIn.FirstName, verifyUrl);

            return new MigrateWalkInResultDto { Success = true, Message = "Email de confirmare trimis" };
        }

        public async Task DeactivateAsync(Guid id)
        {
            var walkIn = await _context.WalkInPatients.FindAsync(id)
                ?? throw new InvalidOperationException("Pacientul nu a fost găsit");

            walkIn.IsActive = false;
            walkIn.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private static string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 12).Select(s => s[random.Next(s.Length)]).ToArray());
        }
        private static WalkInPatientDto ToDto(WalkInPatient w) => new()
        {
            Id = w.Id,
            FirstName = w.FirstName,
            LastName = w.LastName,
            CNP = w.CNP,
            Phone = w.Phone,
            Email = w.Email,
            Age = w.Age,
            Address = w.Address,
            City = w.City,
            IsActive = w.IsActive,
            CreatedAt = w.CreatedAt,
        };
        public async Task ReactivateAsync(Guid id)
        {
            var walkIn = await _context.WalkInPatients.FindAsync(id)
                ?? throw new InvalidOperationException("Pacientul nu a fost găsit");
            walkIn.IsActive = true;
            walkIn.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

    }
}
