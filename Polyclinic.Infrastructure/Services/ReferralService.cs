using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Referrals;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class ReferralService : IReferralService
    {
        private readonly PolyclinicDbContext _context;

        public ReferralService(PolyclinicDbContext context)
        {
            _context = context;
        }

        public async Task<ReferralDto> CreateReferralAsync(Guid doctorUserId, CreateReferralDto dto)
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == doctorUserId)
                ?? throw new NotFoundException("Doctorul nu a fost găsit");

            var patient = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == dto.PatientId && u.IsActive)
                ?? throw new NotFoundException("Pacientul nu a fost găsit");

            var service = await _context.MedicalServices
                .Include(s => s.Specialty)
                .FirstOrDefaultAsync(s => s.Id == dto.ServiceId)
                ?? throw new NotFoundException("Serviciul nu a fost găsit");

            var referral = new Referral
            {
                Id = Guid.NewGuid(),
                PatientId = dto.PatientId,
                ReferringDoctorId = doctor.Id,
                ReferredSpecialtyId = dto.SpecialtyId,
                ReferredServiceId = dto.ServiceId,
                ReferralNumber = $"REF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                Reason = dto.Reason,
                Notes = dto.Notes,
                ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                ValidUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(dto.ValidDays)),
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Referrals.Add(referral);
            await _context.SaveChangesAsync();

            return MapToDto(referral, patient, doctor.User, service);
        }

        public async Task<List<ReferralDto>> GetPatientReferralsAsync(Guid patientId)
        {
            return await _context.Referrals
                .Include(r => r.Patient)
                .Include(r => r.ReferringDoctor).ThenInclude(d => d.User)
                .Include(r => r.ReferredSpecialty)
                .Include(r => r.ReferredService)
                .Where(r => r.PatientId == patientId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReferralDto
                {
                    Id = r.Id,
                    ReferralNumber = r.ReferralNumber,
                    PatientName = $"{r.Patient.FirstName} {r.Patient.LastName}",
                    ReferringDoctorName = $"Dr. {r.ReferringDoctor.User.FirstName} {r.ReferringDoctor.User.LastName}",
                    SpecialtyName = r.ReferredSpecialty.Name,
                    ServiceName = r.ReferredService.Name,
                    Reason = r.Reason,
                    Notes = r.Notes,
                    ValidFrom = r.ValidFrom,
                    ValidUntil = r.ValidUntil,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<ReferralDto>> GetDoctorIssuedReferralsAsync(Guid doctorUserId)
        {
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.UserId == doctorUserId)
                ?? throw new NotFoundException("Doctorul nu a fost găsit");

            return await _context.Referrals
                .Include(r => r.Patient)
                .Include(r => r.ReferringDoctor).ThenInclude(d => d.User)
                .Include(r => r.ReferredSpecialty)
                .Include(r => r.ReferredService)
                .Where(r => r.ReferringDoctorId == doctor.Id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReferralDto
                {
                    Id = r.Id,
                    ReferralNumber = r.ReferralNumber,
                    PatientName = $"{r.Patient.FirstName} {r.Patient.LastName}",
                    ReferringDoctorName = $"Dr. {r.ReferringDoctor.User.FirstName} {r.ReferringDoctor.User.LastName}",
                    SpecialtyName = r.ReferredSpecialty.Name,
                    ServiceName = r.ReferredService.Name,
                    Reason = r.Reason,
                    Notes = r.Notes,
                    ValidFrom = r.ValidFrom,
                    ValidUntil = r.ValidUntil,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ReferralDto?> GetValidReferralAsync(Guid patientId, Guid serviceId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var referral = await _context.Referrals
                .Include(r => r.Patient)
                .Include(r => r.ReferringDoctor).ThenInclude(d => d.User)
                .Include(r => r.ReferredSpecialty)
                .Include(r => r.ReferredService)
                .FirstOrDefaultAsync(r =>
                    r.PatientId == patientId &&
                    r.ReferredServiceId == serviceId &&
                    r.Status == "active" &&
                    r.ValidFrom <= today &&
                    r.ValidUntil >= today);

            if (referral == null) return null;

            return new ReferralDto
            {
                Id = referral.Id,
                ReferralNumber = referral.ReferralNumber,
                PatientName = $"{referral.Patient.FirstName} {referral.Patient.LastName}",
                ReferringDoctorName = $"Dr. {referral.ReferringDoctor.User.FirstName} {referral.ReferringDoctor.User.LastName}",
                SpecialtyName = referral.ReferredSpecialty.Name,
                ServiceName = referral.ReferredService.Name,
                Reason = referral.Reason,
                Notes = referral.Notes,
                ValidFrom = referral.ValidFrom,
                ValidUntil = referral.ValidUntil,
                Status = referral.Status,
                CreatedAt = referral.CreatedAt
            };
        }

        public async Task UseReferralAsync(Guid referralId)
        {
            var referral = await _context.Referrals.FirstOrDefaultAsync(r => r.Id == referralId)
                ?? throw new NotFoundException("Referral-ul nu a fost găsit");

            referral.Status = "used";
            referral.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private ReferralDto MapToDto(Referral referral, User patient, User doctorUser, MedicalService service)
        {
            return new ReferralDto
            {
                Id = referral.Id,
                ReferralNumber = referral.ReferralNumber,
                PatientName = $"{patient.FirstName} {patient.LastName}",
                ReferringDoctorName = $"Dr. {doctorUser.FirstName} {doctorUser.LastName}",
                SpecialtyName = service.Specialty?.Name ?? string.Empty,
                ServiceName = service.Name,
                Reason = referral.Reason,
                Notes = referral.Notes,
                ValidFrom = referral.ValidFrom,
                ValidUntil = referral.ValidUntil,
                Status = referral.Status,
                CreatedAt = referral.CreatedAt
            };
        }
    }
}
