using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class DoctorService : IDoctorService
    {
        private readonly PolyclinicDbContext _context;

        public DoctorService(PolyclinicDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResultDto<DoctorDto>> GetDoctorsAsync(DoctorFilterDto filter)
        {
            var query = _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.Reviews)
                .Where(d => d.User.IsActive)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filter.SearchName))
            {
                var search = filter.SearchName.ToLower();
                query = query.Where(d => (d.User.FirstName + " " + d.User.LastName).ToLower().Contains(search) ||
                        d.Specialty.Name.ToLower().Contains(search));

            }

            if (filter.SpecialtyId.HasValue)
                query = query.Where(d => d.SpecialtyId == filter.SpecialtyId);

            if (filter.LocationId.HasValue)
                query = query.Where(d => d.DoctorLocations
                    .Any(dl => dl.LocationId == filter.LocationId && dl.IsActive));

            if (filter.MaxFee.HasValue)
                query = query.Where(d => d.ConsultationFee <= filter.MaxFee);

            var totalCount = await query.CountAsync();

            var doctors = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(d => new DoctorDto
                {
                    Id = d.Id,
                    SpecialtyId = d.SpecialtyId,
                    FirstName = d.User.FirstName,
                    LastName = d.User.LastName,
                    SpecialtyName = d.Specialty.Name,
                    Bio = d.Bio,
                    ExperienceYears = d.ExperienceYears,
                    ConsultationFee = d.ConsultationFee,
                    ProfilePictureUrl = d.User.ProfilePictureUrl,
                    IsAvailable = d.IsAvailable,
                    AverageRating = d.Reviews.Any()
                    ? Math.Round(d.Reviews.Average(r => r.Rating), 1)
                    : 0,
                                ReviewCount = d.Reviews.Count,
                                LocationIds = d.DoctorLocations
                    .Where(dl => dl.IsActive)
                    .Select(dl => dl.LocationId)
                    .ToList()
                 })
                .ToListAsync();

            return new PagedResultDto<DoctorDto>
            {
                Items = doctors,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        public async Task<DoctorDto> GetDoctorByIdAsync(Guid id)
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.Reviews)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (doctor == null)
                throw new NotFoundException("Doctor negăsit");

            return new DoctorDto
            {
                Id = doctor.Id,
                FirstName = doctor.User.FirstName,
                LastName = doctor.User.LastName,
                SpecialtyName = doctor.Specialty.Name,
                Bio = doctor.Bio,
                ExperienceYears = doctor.ExperienceYears,
                ConsultationFee = doctor.ConsultationFee,
                ProfilePictureUrl = doctor.User.ProfilePictureUrl,
                IsAvailable = doctor.IsAvailable,
                AverageRating = doctor.Reviews.Any()
                    ? Math.Round(doctor.Reviews.Average(r => r.Rating), 1)
                    : 0,
                ReviewCount = doctor.Reviews.Count
            };
        }
        public async Task<List<MedicalServiceDto>> GetDoctorServicesAsync(Guid doctorId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // servicii care au cel putin un slot generat in viitor
            var serviceIdsWithSlots = await _context.TimeSlots
                .Where(t => t.DoctorId == doctorId && t.SlotDate >= today && !t.IsBlocked)
                .Select(t => t.ServiceId)
                .Distinct()
                .ToListAsync();

            return await _context.DoctorServices
                .Include(ds => ds.Service)
                .Where(ds =>
                    ds.DoctorId == doctorId &&
                    ds.Service.IsActive &&
                    ds.Service.IsBookableOnline &&
                    serviceIdsWithSlots.Contains(ds.ServiceId))
                .Select(ds => new MedicalServiceDto
                {
                    Id = ds.Service.Id,
                    Name = ds.Service.Name,
                    Price = ds.Service.Price,
                    DurationMinutes = ds.Service.DurationMinutes,
                    RequiresReferral = ds.Service.RequiresReferral,
                    IsBookableOnline = ds.Service.IsBookableOnline,
                    IsCNASCovered = ds.Service.IsCNASCovered,
                    CNASCoveredAmount = ds.Service.CNASCoveredAmount,
                })
                .ToListAsync();
        }
        public async Task<List<SpecialtyDto>> GetSpecialtiesAsync()
        {
            return await _context.Specialties
                .Where(s => s.IsActive)
                .Select(s => new SpecialtyDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    IsActive = s.IsActive,
                    DoctorCount = s.Doctors.Count(d => d.IsAvailable)
                })
                .ToListAsync();
        }
        public async Task<List<LocationDto>> GetLocationsAsync()
        {
            return await _context.Locations
                .Where(l => l.IsActive)
                .Select(l => new LocationDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    Address = l.Address,
                    City = l.City,
                    County = l.County,
                    Phone = l.Phone,
                    IsActive = l.IsActive
                })
                .ToListAsync();
        }
        public async Task<List<MedicalServiceDto>> GetAllDoctorServicesAsync(Guid doctorId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var serviceIdsWithSlots = await _context.TimeSlots
                .Where(t => t.DoctorId == doctorId && t.SlotDate >= today && !t.IsBlocked)
                .Select(t => t.ServiceId)
                .Distinct()
                .ToListAsync();

            return await _context.DoctorServices
                .Where(ds => ds.DoctorId == doctorId && serviceIdsWithSlots.Contains(ds.ServiceId))
                .Select(ds => new MedicalServiceDto
                {
                    Id = ds.Service.Id,
                    Name = ds.Service.Name,
                    DurationMinutes = ds.Service.DurationMinutes,
                    Price = ds.Service.Price,
                    RequiresReferral = ds.Service.RequiresReferral,
                    IsBookableOnline = ds.Service.IsBookableOnline,
                    IsActive = ds.Service.IsActive,
                    IsCNASCovered = ds.Service.IsCNASCovered,
                    CNASCoveredAmount = ds.Service.CNASCoveredAmount
                })
                .ToListAsync();
        }
        public async Task<List<MedicalServiceDto>> GetDoctorServicesByLocationAsync(Guid doctorId, Guid locationId)
        {
            var schedules = await _context.DoctorLocations
                .Where(dl => dl.DoctorId == doctorId && dl.LocationId == locationId && dl.IsActive && dl.ServiceId != null)
                .Select(dl => dl.ServiceId)
                .ToListAsync();

            if (!schedules.Any())
                return await GetAllDoctorServicesAsync(doctorId);

            return await _context.DoctorServices
                .Where(ds => ds.DoctorId == doctorId && schedules.Contains(ds.ServiceId))
                .Select(ds => new MedicalServiceDto
                {
                    Id = ds.Service.Id,
                    Name = ds.Service.Name,
                    DurationMinutes = ds.Service.DurationMinutes,
                    Price = ds.Service.Price,
                    RequiresReferral = ds.Service.RequiresReferral,
                    IsBookableOnline = ds.Service.IsBookableOnline,
                    CNASCoveredAmount = ds.Service.CNASCoveredAmount,
                    IsCNASCovered = ds.Service.IsCNASCovered,
                    IsActive = ds.Service.IsActive,
                })
                .ToListAsync();
        }
        public async Task<List<MedicalServiceDto>> GetServicesBySpecialtyAsync(Guid specialtyId)
        {
            return await _context.MedicalServices
                .Where(s => s.SpecialtyId == specialtyId && s.IsActive)
                .Select(s => new MedicalServiceDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    DurationMinutes = s.DurationMinutes,
                    Price = s.Price,
                    RequiresReferral = s.RequiresReferral,
                    IsBookableOnline = s.IsBookableOnline,
                    SpecialtyId = s.SpecialtyId,
                    IsActive = s.IsActive,
                    IsCNASCovered = s.IsCNASCovered,
                    CNASCoveredAmount = s.CNASCoveredAmount,
                    SpecialtyName = s.Specialty.Name
                })
                .ToListAsync();
        }
        public async Task<List<MedicalServiceDto>> GetCNASServicesAsync()
        {
            return await _context.MedicalServices
                .Include(s => s.Specialty)
                .Where(s => s.IsCNASCovered && s.IsActive)
                .Select(s => new MedicalServiceDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    DurationMinutes = s.DurationMinutes,
                    Price = s.Price,
                    RequiresReferral = s.RequiresReferral,
                    IsBookableOnline = s.IsBookableOnline,
                    IsCNASCovered = s.IsCNASCovered,
                    CNASCoveredAmount = s.CNASCoveredAmount,
                    SpecialtyId = s.SpecialtyId,
                    SpecialtyName = s.Specialty.Name,
                    IsActive = s.IsActive
                })
                .ToListAsync();
        }

        public async Task<PublicStatsDto> GetPublicStatsAsync()
        {
            var totalAppointments = await _context.Appointments
                .Where(a => a.Status != "cancelled")
                .CountAsync();

            var totalDoctors = await _context.Doctors
                .Where(d => d.IsAvailable)
                .CountAsync();

            return new PublicStatsDto
            {
                TotalAppointments = totalAppointments,
                TotalDoctors = totalDoctors,
            };
        }
    }
}
