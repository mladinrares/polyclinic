using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Admin;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;

namespace Polyclinic.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly PolyclinicDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IAuditService _auditService;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;

        public AdminService(PolyclinicDbContext context,
            ITokenService tokenService,
            IAuditService auditService,
            IEmailService emailService,
            INotificationService notificationService)
        {
            _context = context;
            _tokenService = tokenService;
            _auditService = auditService;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        public async Task<AdminStatsDto> GetStatsAsync()
        {
            var now = DateTime.UtcNow;
            var today = DateOnly.FromDateTime(now);
            var firstDayOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var appointments = await _context.Appointments.ToListAsync();
            var appointmentsByDay = await _context.Appointments
                .Where(a => a.CreatedAt >= now.AddDays(-7))
                .GroupBy(a => a.CreatedAt.Date)
                .Select(g => new AppointmentsByDayDto
                {
                    Day = g.Key.ToString("dd/MM"),
                    Count = g.Count()
                })
                .ToListAsync();

            return new AdminStatsDto
            {
                TotalPatients = await _context.Users.CountAsync(u => u.Role == "patient" && u.IsActive),
                TotalDoctors = await _context.Doctors.CountAsync(),
                TotalAppointments = appointments.Count,
                AppointmentsToday = await _context.Appointments
                    .CountAsync(a => a.TimeSlot.SlotDate == today),
                AppointmentsThisMonth = appointments.Count(a => a.CreatedAt >= firstDayOfMonth),
                PendingAppointments = appointments.Count(a => a.Status == "pending"),
                CancelledAppointments = appointments.Count(a => a.Status == "cancelled"),
                TotalRevenue = appointments
                    .Where(a => a.Status == "completed")
                    .Sum(a => a.PricePaid),
                RevenueThisMonth = appointments
                    .Where(a => a.Status == "completed" && a.CreatedAt >= firstDayOfMonth)
                    .Sum(a => a.PricePaid),
                AppointmentsByDay = appointmentsByDay
            };
        }

        public async Task<DoctorDto> CreateDoctorAsync(CreateDoctorDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new ConflictException("Email-ul există deja");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Phone = dto.Phone ?? string.Empty,
                Role = "doctor",
                IsActive = true,
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);

            var doctor = new Doctor
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                SpecialtyId = dto.SpecialtyId,
                LicenseNumber = dto.LicenseNumber,
                Bio = dto.Bio,
                ExperienceYears = dto.ExperienceYears,
                ConsultationFee = dto.ConsultationFee,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(null, "CREATE_DOCTOR", "Doctor", doctor.Id, null, new { dto.Email, dto.LicenseNumber });

            return await GetDoctorDtoAsync(doctor.Id);
        }

        public async Task<DoctorDto> UpdateDoctorAsync(Guid id, UpdateDoctorDto dto)
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .FirstOrDefaultAsync(d => d.Id == id)
                ?? throw new NotFoundException("Doctorul nu a fost găsit");

            doctor.User.FirstName = dto.FirstName;
            doctor.User.LastName = dto.LastName;
            doctor.SpecialtyId = dto.SpecialtyId;
            doctor.Bio = dto.Bio;
            doctor.ExperienceYears = dto.ExperienceYears;
            doctor.ConsultationFee = dto.ConsultationFee;
            doctor.LicenseNumber = dto.LicenseNumber;
            doctor.UpdatedAt = DateTime.UtcNow;
            doctor.User.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new DoctorDto
            {
                Id = doctor.Id,
                FirstName = doctor.User.FirstName,
                LastName = doctor.User.LastName,
                SpecialtyName = doctor.Specialty.Name,
                SpecialtyId = doctor.SpecialtyId,
                Bio = doctor.Bio,
                ExperienceYears = doctor.ExperienceYears,
                ConsultationFee = doctor.ConsultationFee,
                IsAvailable = doctor.IsAvailable,
                LicenseNumber = doctor.LicenseNumber,
                LocationIds = doctor.DoctorLocations
                    .Where(dl => dl.IsActive)
                    .Select(dl => dl.LocationId)
                    .ToList()
            };
        }

        public async Task DeleteDoctorAsync(Guid id)
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id)
                ?? throw new NotFoundException("Doctor negăsit");

            doctor.User.IsActive = false;
            doctor.User.UpdatedAt = DateTime.UtcNow;
            doctor.IsAvailable = false;
            doctor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(null, "DEACTIVATE_DOCTOR", "Doctor", doctor.Id);
        }

        public async Task<List<SpecialtyDto>> GetSpecialtiesAsync(bool includeInactive = false)
        {
            return await _context.Specialties
                .Where(s => includeInactive || s.IsActive)
                .Select(s => new SpecialtyDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    IsActive = s.IsActive,
                    DoctorCount = s.Doctors.Count
                })
                .ToListAsync();
        }

        public async Task<SpecialtyDto> CreateSpecialtyAsync(CreateSpecialtyDto dto)
        {
            if (await _context.Specialties.AnyAsync(s => s.Name == dto.Name))
                throw new ConflictException("Specialitatea există deja");

            var specialty = new Specialty
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Specialties.Add(specialty);
            await _context.SaveChangesAsync();

            return new SpecialtyDto
            {
                Id = specialty.Id,
                Name = specialty.Name,
                Description = specialty.Description,
                IsActive = specialty.IsActive,
                DoctorCount = 0
            };
        }

        public async Task DeleteSpecialtyAsync(Guid id)
        {
            var specialty = await _context.Specialties.FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Specialitatea nu a fost găsită");

            specialty.IsActive = false;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<List<LocationDto>> GetLocationsAsync(bool includeInactive = false)
        {
            return await _context.Locations
                .Where(s => includeInactive || s.IsActive)
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

        public async Task<LocationDto> CreateLocationAsync(CreateLocationDto dto)
        {
            var location = new Location
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Address = dto.Address,
                City = dto.City,
                County = dto.County,
                Phone = dto.Phone,
                Email = dto.Email,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                Address = location.Address,
                City = location.City,
                County = location.County,
                Phone = location.Phone,
                IsActive = location.IsActive
            };
        }

        public async Task DeleteLocationAsync(Guid id)
        {
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == id)
                ?? throw new NotFoundException("Locația nu a fost găsită");

            location.IsActive = false;
            location.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task<DoctorDto> GetDoctorDtoAsync(Guid doctorId)
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.Reviews)
                .FirstAsync(d => d.Id == doctorId);

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
        public async Task<List<MedicalServiceDto>> GetServicesAsync(bool includeInactive = false)
        {
            return await _context.MedicalServices
                .Include(s => s.Specialty)
                .Where(s => includeInactive || s.IsActive)
                .Select(s => new MedicalServiceDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    DurationMinutes = s.DurationMinutes,
                    Price = s.Price,
                    RequiresReferral = s.RequiresReferral,
                    IsBookableOnline = s.IsBookableOnline,
                    SpecialtyId = s.SpecialtyId,
                    SpecialtyName = s.Specialty.Name,
                    IsActive = s.IsActive,
                    IsCNASCovered = s.IsCNASCovered,
                    CNASCoveredAmount = s.CNASCoveredAmount
                })
                .ToListAsync();
        }

        public async Task<MedicalServiceDto> CreateServiceAsync(CreateMedicalServiceDto dto)
        {
            var service = new MedicalService
            {
                Id = Guid.NewGuid(),
                SpecialtyId = dto.SpecialtyId,
                Name = dto.Name,
                Description = dto.Description,
                DurationMinutes = dto.DurationMinutes,
                Price = dto.Price,
                RequiresReferral = dto.RequiresReferral,
                IsBookableOnline = dto.IsBookableOnline,
                IsCNASCovered = dto.IsCNASCovered,
                CNASCoveredAmount = dto.CNASCoveredAmount,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MedicalServices.Add(service);
            await _context.SaveChangesAsync();

            return new MedicalServiceDto
            {
                Id = service.Id,
                Name = service.Name,
                DurationMinutes = service.DurationMinutes,
                Price = service.Price,
                RequiresReferral = service.RequiresReferral,
                IsBookableOnline = service.IsBookableOnline
            };
        }

        public async Task DeleteServiceAsync(Guid id)
        {
            var service = await _context.MedicalServices.FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Serviciul nu a fost găsit");

            service.IsActive = false;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        public async Task AddServiceToDoctorAsync(Guid doctorId, Guid serviceId)
        {
            var exists = await _context.DoctorServices
                .AnyAsync(ds => ds.DoctorId == doctorId && ds.ServiceId == serviceId);

            if (exists)
                throw new ConflictException("Serviciul este deja asociat doctorului");

            _context.DoctorServices.Add(new Polyclinic.Domain.Entities.DoctorService
            {
                Id = Guid.NewGuid(),
                DoctorId = doctorId,
                ServiceId = serviceId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        public async Task RemoveServiceFromDoctorAsync(Guid doctorId, Guid serviceId)
        {
            var doctorService = await _context.DoctorServices
                .FirstOrDefaultAsync(ds => ds.DoctorId == doctorId && ds.ServiceId == serviceId)
                ?? throw new NotFoundException("Asocierea nu a fost găsită");

            _context.DoctorServices.Remove(doctorService);
            await _context.SaveChangesAsync();
        }


        public async Task<List<DoctorScheduleDto>> GetDoctorSchedulesAsync(Guid doctorId)
        {
            return await _context.DoctorLocations
                .Include(dl => dl.Location)
                .Include(dl => dl.Service)
                .Include(dl => dl.Doctor).ThenInclude(d => d.User)
                .Where(dl => dl.DoctorId == doctorId && dl.IsActive)
                .Select(dl => new DoctorScheduleDto
                {
                    Id = dl.Id,
                    DoctorName = $"Dr. {dl.Doctor.User.FirstName} {dl.Doctor.User.LastName}",
                    LocationName = dl.Location.Name,
                    ServiceName = dl.Service != null ? dl.Service.Name : null,
                    WorkingDays = dl.WorkingDays,
                    StartTime = dl.StartTime,
                    EndTime = dl.EndTime,
                    IsActive = dl.IsActive
                })
                .ToListAsync();
        }

        public async Task<DoctorScheduleDto> CreateDoctorScheduleAsync(CreateDoctorScheduleDto dto)
        {
            var doctorLocation = new DoctorLocation
            {
                Id = Guid.NewGuid(),
                DoctorId = dto.DoctorId,
                LocationId = dto.LocationId,
                ServiceId = dto.ServiceId,
                WorkingDays = string.Join(",", dto.WorkingDays),
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.DoctorLocations.Add(doctorLocation);
            await _context.SaveChangesAsync();

            await GenerateSlotsFromScheduleAsync(dto.DoctorId);

            return await _context.DoctorLocations
                .Include(dl => dl.Location)
                .Include(dl => dl.Service)
                .Include(dl => dl.Doctor).ThenInclude(d => d.User)
                .Where(dl => dl.Id == doctorLocation.Id)
                .Select(dl => new DoctorScheduleDto
                {
                    Id = dl.Id,
                    DoctorName = $"Dr. {dl.Doctor.User.FirstName} {dl.Doctor.User.LastName}",
                    LocationName = dl.Location.Name,
                    ServiceName = dl.Service != null ? dl.Service.Name : null,
                    WorkingDays = dl.WorkingDays,
                    StartTime = dl.StartTime,
                    EndTime = dl.EndTime,
                    IsActive = dl.IsActive
                })
                .FirstAsync();
        }

        public async Task DeleteDoctorScheduleAsync(Guid id)
        {
            var schedule = await _context.DoctorLocations.FirstOrDefaultAsync(dl => dl.Id == id)
                ?? throw new NotFoundException("Programul nu a fost găsit");

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var futureSlots = await _context.TimeSlots
                .Where(t =>
                    t.DoctorId == schedule.DoctorId &&
                    t.LocationId == schedule.LocationId &&
                    t.SlotDate >= today &&
                    t.IsAvailable)
                .ToListAsync();

            _context.TimeSlots.RemoveRange(futureSlots);

            schedule.IsActive = false;
            schedule.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task GenerateSlotsFromScheduleAsync(Guid doctorId, int daysAhead = 30)
        {
            var schedules = await _context.DoctorLocations
                .Include(dl => dl.Service)
                .Where(dl => dl.DoctorId == doctorId && dl.IsActive)
                .ToListAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            foreach (var schedule in schedules)
            {
                var workingDays = schedule.WorkingDays.Split(',').ToList();
                var durationMinutes = schedule.Service?.DurationMinutes ?? 30;

                for (int day = 0; day < daysAhead; day++)
                {
                    var slotDate = today.AddDays(day);
                    var dayName = slotDate.DayOfWeek.ToString();

                    if (!workingDays.Contains(dayName)) continue;

                    var existingSlots = await _context.TimeSlots
                        .AnyAsync(t =>
                            t.DoctorId == doctorId &&
                            t.LocationId == schedule.LocationId &&
                            t.SlotDate == slotDate);

                    if (existingSlots) continue;

                    var currentTime = schedule.StartTime;
                    var newSlots = new List<TimeSlot>();

                    while (currentTime.AddMinutes(durationMinutes) <= schedule.EndTime)
                    {
                        newSlots.Add(new TimeSlot
                        {
                            Id = Guid.NewGuid(),
                            DoctorId = doctorId,
                            LocationId = schedule.LocationId,
                            ServiceId = schedule.ServiceId,
                            SlotDate = slotDate,
                            StartTime = currentTime,
                            EndTime = currentTime.AddMinutes(durationMinutes),
                            IsAvailable = true,
                            IsBlocked = false,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });

                        currentTime = currentTime.AddMinutes(durationMinutes);
                    }

                    await _context.TimeSlots.AddRangeAsync(newSlots);
                }
            }

            await _context.SaveChangesAsync();
        }
        public async Task ReactivateDoctorAsync(Guid id)
        {
            var doctor = await _context.Doctors.Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id)
                ?? throw new NotFoundException("Doctor negăsit");

            doctor.IsAvailable = true;
            doctor.User.IsActive = true;
            doctor.UpdatedAt = DateTime.UtcNow;
            doctor.User.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(null, "REACTIVATE_DOCTOR", "Doctor", id);
        }

        public async Task ReactivateSpecialtyAsync(Guid id)
        {
            var specialty = await _context.Specialties.FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Specialitatea nu a fost găsită");

            specialty.IsActive = true;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task ReactivateLocationAsync(Guid id)
        {
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == id)
                ?? throw new NotFoundException("Locația nu a fost găsită");

            location.IsActive = true;
            location.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task ReactivateServiceAsync(Guid id)
        {
            var service = await _context.MedicalServices.FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Serviciul nu a fost găsit");

            service.IsActive = true;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<List<DoctorDto>> GetAllDoctorsAsync(bool includeInactive = false)
        {
            return await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialty)
                .Include(d => d.Reviews)
                .Where(d => includeInactive || d.User.IsActive)
                .Select(d => new DoctorDto
                {
                    Id = d.Id,
                    FirstName = d.User.FirstName,
                    LastName = d.User.LastName,
                    SpecialtyName = d.Specialty.Name,
                    SpecialtyId = d.SpecialtyId,
                    Bio = d.Bio,
                    LicenseNumber = d.LicenseNumber,
                    ExperienceYears = d.ExperienceYears,
                    ConsultationFee = d.ConsultationFee,
                    ProfilePictureUrl = d.User.ProfilePictureUrl,
                    IsAvailable = d.IsAvailable,
                    AverageRating = d.Reviews.Any()
                        ? Math.Round(d.Reviews.Average(r => r.Rating), 1)
                        : 0,
                    ReviewCount = d.Reviews.Count
                })
                .ToListAsync();
        }

        public async Task<MedicalServiceDto> UpdateServiceAsync(Guid id, CreateMedicalServiceDto dto)
        {
            var service = await _context.MedicalServices
                .Include(s => s.Specialty)
                .FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Serviciul nu a fost găsit");

            service.Name = dto.Name;
            service.SpecialtyId = dto.SpecialtyId;
            service.DurationMinutes = dto.DurationMinutes;
            service.Price = dto.Price;
            service.RequiresReferral = dto.RequiresReferral;
            service.IsBookableOnline = dto.IsBookableOnline;
            service.IsCNASCovered = dto.IsCNASCovered;
            service.CNASCoveredAmount = dto.CNASCoveredAmount;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new MedicalServiceDto
            {
                Id = service.Id,
                Name = service.Name,
                DurationMinutes = service.DurationMinutes,
                Price = service.Price,
                RequiresReferral = service.RequiresReferral,
                IsBookableOnline = service.IsBookableOnline,
                IsCNASCovered = service.IsCNASCovered,
                CNASCoveredAmount = service.CNASCoveredAmount,
                SpecialtyId = service.SpecialtyId,
                SpecialtyName = service.Specialty.Name,
                IsActive = service.IsActive
            };
        }
        public async Task<SpecialtyDto> UpdateSpecialtyAsync(Guid id, CreateSpecialtyDto dto)
        {
            var specialty = await _context.Specialties.FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new NotFoundException("Specialitatea nu a fost găsită");

            specialty.Name = dto.Name;
            specialty.Description = dto.Description;
            specialty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new SpecialtyDto
            {
                Id = specialty.Id,
                Name = specialty.Name,
                Description = specialty.Description,
                IsActive = specialty.IsActive,
                DoctorCount = await _context.Doctors.CountAsync(d => d.SpecialtyId == specialty.Id && d.IsAvailable)
            };
        }
        public async Task<LocationDto> UpdateLocationAsync(Guid id, CreateLocationDto dto)
        {
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == id)
                ?? throw new NotFoundException("Locația nu a fost găsită");

            location.Name = dto.Name;
            location.Address = dto.Address;
            location.City = dto.City;
            location.County = dto.County;
            location.Phone = dto.Phone;
            location.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                Address = location.Address,
                City = location.City,
                County = location.County,
                Phone = location.Phone,
                IsActive = location.IsActive
            };
        }
        public async Task<List<MonthlyStatsDto>> GetMonthlyStatsAsync()
        {
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);

            var appointments = await _context.Appointments
                .Include(a => a.TimeSlot)
                .Where(a => a.CreatedAt >= sixMonthsAgo)
                .ToListAsync();

            return appointments
                .GroupBy(a => new { a.CreatedAt.Year, a.CreatedAt.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new MonthlyStatsDto
                {
                    Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                    Appointments = g.Count(),
                    Revenue = g.Where(a => a.PaymentStatus == "paid").Sum(a => a.PricePaid),
                    Cancellations = g.Count(a => a.Status == "cancelled"),
                })
                .ToList();
        }
        public async Task GenerateSlotsAsync(Guid doctorId, int days)
        {
            var schedules = await _context.DoctorLocations
                .Where(dl => dl.DoctorId == doctorId && dl.IsActive)
                .ToListAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            for (int i = 0; i < days; i++)
            {
                var date = today.AddDays(i);
                var dayOfWeek = date.DayOfWeek.ToString();

                var matchingSchedules = schedules
                    .Where(s => s.WorkingDays != null && s.WorkingDays.Contains(dayOfWeek))
                    .ToList();

                foreach (var schedule in matchingSchedules)
                {
                    var duration = 30;
                    if (schedule.ServiceId.HasValue)
                    {
                        var service = await _context.MedicalServices.FindAsync(schedule.ServiceId);
                        duration = service?.DurationMinutes ?? 30;
                    }

                    var current = schedule.StartTime;
                    while (current.Add(TimeSpan.FromMinutes(duration)) <= schedule.EndTime)
                    {
                        var exists = await _context.TimeSlots.AnyAsync(t =>
                            t.DoctorId == doctorId &&
                            t.LocationId == schedule.LocationId &&
                            t.SlotDate == date &&
                            t.StartTime == current);

                        if (!exists)
                        {
                            _context.TimeSlots.Add(new TimeSlot
                            {
                                Id = Guid.NewGuid(),
                                DoctorId = doctorId,
                                LocationId = schedule.LocationId,
                                ServiceId = schedule.ServiceId,
                                SlotDate = date,
                                StartTime = current,
                                EndTime = current.Add(TimeSpan.FromMinutes(duration)),
                                IsAvailable = true,
                                IsBlocked = false,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow,
                            });
                        }
                        current = current.Add(TimeSpan.FromMinutes(duration));
                    }
                }
            }
            await _context.SaveChangesAsync();
        }

        public async Task DeleteSlotsByDateAsync(Guid doctorId, DateOnly date, string cancelReason)
        {
            var slots = await _context.TimeSlots
                .Where(t => t.DoctorId == doctorId && t.SlotDate == date)
                .ToListAsync();

            foreach (var slot in slots)
            {
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Service)
                    .FirstOrDefaultAsync(a => a.TimeSlotId == slot.Id && a.Status == "confirmed");

                if (appointment != null)
                {
                    appointment.Status = "cancelled";
                    appointment.CancellationReason = cancelReason;
                    appointment.CancelledAt = DateTime.UtcNow;
                    appointment.UpdatedAt = DateTime.UtcNow;
                    if (appointment.PatientId.HasValue)
                    {
                        await _notificationService.CreateNotificationAsync(
                            appointment.PatientId.Value,
                            "Programare anulată",
                            $"Programarea din {date} a fost anulată: {cancelReason}",
                            "appointment_cancelled",
                            appointment.Id
                        );
                    }

                    try
                    {
                        var doctor = await _context.Doctors
                            .Include(d => d.User)
                            .FirstOrDefaultAsync(d => d.Id == doctorId);
                        if (appointment.PatientId.HasValue && appointment.Patient != null)
                        {
                            await _emailService.SendAppointmentCancellationAsync(
                                appointment.Patient.Email,
                                appointment.Patient.FirstName,
                                $"Dr. {doctor!.User.FirstName} {doctor.User.LastName}",
                                appointment.Service.Name,
                                date.ToString("dd MMMM yyyy"),
                                slot.StartTime.ToString(@"hh\:mm"),
                                cancelReason
                            );
                        }
                        else if (appointment.WalkInPatientId.HasValue)
                        {
                            var walkIn = await _context.WalkInPatients.FindAsync(appointment.WalkInPatientId);
                            if (walkIn != null)
                            {
                                // walk-in nu are email, doar notificare telefonica
                                // puteti adauga email optional pe WalkInPatient daca vreti
                            }
                        }
                    }
                    catch { }
                }
            }

            _context.TimeSlots.RemoveRange(slots);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteSlotsByTimeAsync(Guid doctorId, DateOnly date, TimeOnly time, string cancelReason)
        {
            var slots = await _context.TimeSlots
                .Where(t => t.DoctorId == doctorId && t.SlotDate == date && t.StartTime == time)
                .ToListAsync();

            foreach (var slot in slots)
            {
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Service)
                    .FirstOrDefaultAsync(a => a.TimeSlotId == slot.Id && a.Status == "confirmed");

                if (appointment != null)
                {
                    appointment.Status = "cancelled";
                    appointment.CancellationReason = cancelReason;
                    appointment.CancelledAt = DateTime.UtcNow;
                    appointment.UpdatedAt = DateTime.UtcNow;
                    if (appointment.PatientId.HasValue)
                    {
                        await _notificationService.CreateNotificationAsync(
                            appointment.PatientId.Value,
                            "Programare anulată",
                            $"Programarea din {date} ora {time} a fost anulată: {cancelReason}",
                            "appointment_cancelled",
                            appointment.Id
                        );
                    }

                    try
                    {
                        var doctor = await _context.Doctors
                            .Include(d => d.User)
                            .FirstOrDefaultAsync(d => d.Id == doctorId);
                        if (appointment.PatientId.HasValue && appointment.Patient != null)
                        {
                            await _emailService.SendAppointmentCancellationAsync(
                                appointment.Patient.Email,
                                appointment.Patient.FirstName,
                                $"Dr. {doctor!.User.FirstName} {doctor.User.LastName}",
                                appointment.Service.Name,
                                date.ToString("dd MMMM yyyy"),
                                time.ToString(@"hh\:mm"),
                                cancelReason
                            );
                        }
                        else if (appointment.WalkInPatientId.HasValue)
                        {
                            var walkIn = await _context.WalkInPatients.FindAsync(appointment.WalkInPatientId);
                            if (walkIn != null)
                            {
                                // walk-in nu are email, doar notificare telefonica
                                // puteti adauga email optional pe WalkInPatient daca vreti
                            }
                        }
                    }
                    catch { }
                }
            }

            _context.TimeSlots.RemoveRange(slots);
            await _context.SaveChangesAsync();
        }

        public async Task<List<SlotsByDateDto>> GetDoctorSlotsCalendarAsync(Guid doctorId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var thirtyDaysLater = today.AddDays(30);

            var slots = await _context.TimeSlots
                .Include(t => t.Location)
                .Where(t => t.DoctorId == doctorId && t.SlotDate >= today && t.SlotDate <= thirtyDaysLater)
                .OrderBy(t => t.SlotDate).ThenBy(t => t.StartTime)
                .ToListAsync();

            var appointments = await _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.DoctorId == doctorId && a.Status == "confirmed")
                .ToListAsync();

            return slots
                .GroupBy(t => t.SlotDate)
                .Select(g => new SlotsByDateDto
                {
                    Date = g.Key,
                    Slots = g.Select(t => new SlotTimeDto
                    {
                        Id = t.Id,
                        StartTime = t.StartTime,
                        EndTime = t.EndTime,
                        IsAvailable = t.IsAvailable,
                        HasAppointment = appointments.Any(a => a.TimeSlotId == t.Id),
                        PatientName = appointments.FirstOrDefault(a => a.TimeSlotId == t.Id)?.Patient != null
                            ? $"{appointments.First(a => a.TimeSlotId == t.Id).Patient.FirstName} {appointments.First(a => a.TimeSlotId == t.Id).Patient.LastName}"
                            : null,
                        LocationName = t.Location?.Name,
                    }).ToList(),
                })
                .ToList();
        }
    }
}
