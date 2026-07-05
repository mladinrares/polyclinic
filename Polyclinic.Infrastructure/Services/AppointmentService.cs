using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polyclinic.Application.DTOs.Appointments;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;

namespace Polyclinic.Infrastructure.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly PolyclinicDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IAuditService _auditService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AppointmentService> _logger;

        public AppointmentService(PolyclinicDbContext context,
            INotificationService notificationService,
            IAuditService auditService,
            IEmailService emailService,
            ILogger<AppointmentService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _auditService = auditService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<List<TimeSlotDto>> GetAvailableSlotsAsync(Guid doctorId, Guid locationId, DateOnly date, Guid? serviceId = null)
        {
            var query = _context.TimeSlots
                .Where(t =>
                    t.DoctorId == doctorId &&
                    t.LocationId == locationId &&
                    t.SlotDate == date &&
                    t.IsAvailable &&
                    !t.IsBlocked);

            if (serviceId.HasValue)
                query = query.Where(t => t.ServiceId == serviceId || t.ServiceId == null);

            return await query
                .OrderBy(t => t.StartTime)
                .Select(t => new TimeSlotDto
                {
                    Id = t.Id,
                    SlotDate = t.SlotDate,
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                    IsAvailable = t.IsAvailable
                })
                .ToListAsync();
        }

        public async Task<AppointmentDto> CreateAppointmentAsync(Guid patientId, CreateAppointmentDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var slot = await _context.TimeSlots
                    .FromSqlRaw("SELECT * FROM \"TimeSlots\" WHERE \"Id\" = {0} FOR UPDATE", dto.TimeSlotId)
                    .FirstOrDefaultAsync();
                if (slot == null || !slot.IsAvailable || slot.IsBlocked)
                    throw new ConflictException("Slot indisponibil");

                var service = await _context.MedicalServices
                    .FirstOrDefaultAsync(s => s.Id == dto.ServiceId)
                    ?? throw new NotFoundException("Serviciul nu a fost găsit");

                var finalPrice = service.Price;
                var isCNASApplied = false;
                if (service.IsCNASCovered)
                {
                    var today = DateOnly.FromDateTime(DateTime.UtcNow);
                    var validCard = await _context.InsuranceCards
                        .FirstOrDefaultAsync(c =>
                            c.PatientId == patientId &&
                            c.IsActive &&
                            c.IsVerified &&
                            c.ExpiryDate >= today);
                    if (validCard != null)
                    {
                        var cnasAmount = service.CNASCoveredAmount ?? service.Price;
                        finalPrice = Math.Max(0, service.Price - cnasAmount);
                        isCNASApplied = true;
                    }
                }

                var appointment = new Appointment
                {
                    Id = Guid.NewGuid(),
                    ExternalReferralUrl = dto.ExternalReferralUrl,
                    PatientId = patientId,
                    DoctorId = dto.DoctorId,
                    ServiceId = dto.ServiceId,
                    LocationId = dto.LocationId,
                    TimeSlotId = dto.TimeSlotId,
                    Status = dto.ExternalReferralUrl != null ? "pending_referral_verification" : "confirmed",
                    Type = dto.Type,
                    Reason = dto.Reason,
                    PricePaid = finalPrice,
                    PaymentStatus = "unpaid",
                    ConfirmedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                slot.IsAvailable = false;
                slot.UpdatedAt = DateTime.UtcNow;
                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _auditService.LogAsync(patientId, "CREATE_APPOINTMENT", "Appointment", appointment.Id, null,
                    new { appointment.DoctorId, appointment.ServiceId, appointment.Status });

                await _notificationService.CreateNotificationAsync(
                    patientId,
                    "Programare confirmată",
                    $"Programarea ta a fost confirmată pentru {slot.SlotDate} la ora {slot.StartTime}.",
                    "appointment_confirmed",
                    appointment.Id
                );

                // trimite email confirmare doar daca e confirmed direct
                if (appointment.Status == "confirmed")
                {
                    try
                    {
                        var patient = await _context.Users.FindAsync(patientId);
                        var doctor = await _context.Doctors
                            .Include(d => d.User)
                            .FirstOrDefaultAsync(d => d.Id == dto.DoctorId);
                        var location = await _context.Locations.FindAsync(dto.LocationId);

                        if (patient != null && doctor != null && location != null)
                        {
                            await _emailService.SendAppointmentConfirmationAsync(
                                patient.Email,
                                patient.FirstName,
                                $"Dr. {doctor.User.FirstName} {doctor.User.LastName}",
                                service.Name,
                                slot.SlotDate.ToString("dd MMMM yyyy"),
                                slot.StartTime.ToString(@"hh\:mm"),
                                location.Name
                            );
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Eroare la trimiterea email-ului de confirmare");
                    }
                }

                return await GetAppointmentDtoAsync(appointment.Id);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<PagedResultDto<AppointmentDto>> GetPatientAppointmentsAsync(Guid patientId, int page, int pageSize)
        {
            var query = _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Doctor).ThenInclude(d => d.Specialty)
                .Include(a => a.Service)
                .Include(a => a.Location)
                .Include(a => a.TimeSlot)
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync();

            var appointments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AppointmentDto
                {
                    Id = a.Id,
                    DoctorName = $"Dr. {a.Doctor.User.FirstName} {a.Doctor.User.LastName}",
                    SpecialtyName = a.Doctor.Specialty.Name,
                    ServiceName = a.Service.Name,
                    LocationName = a.Location.Name,
                    SlotDate = a.TimeSlot.SlotDate.ToDateTime(TimeOnly.MinValue),
                    StartTime = a.TimeSlot.StartTime.ToTimeSpan(),
                    EndTime = a.TimeSlot.EndTime.ToTimeSpan(),
                    Status = a.Status,
                    Type = a.Type,
                    HasReview = _context.Reviews.Any(r => r.AppointmentId == a.Id),
                    PricePaid = a.PricePaid,
                    PaymentStatus = a.PaymentStatus,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return new PagedResultDto<AppointmentDto>
            {
                Items = appointments,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task CancelAppointmentAsync(Guid appointmentId, Guid userId, string reason, string? cancelledByRole)
        {
            var appointment = await _context.Appointments
                .Include(a => a.TimeSlot)
                .FirstOrDefaultAsync(a => a.Id == appointmentId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            if (appointment.PatientId != userId &&
                !await _context.Users.AnyAsync(u => u.Id == userId && (u.Role == "admin" || u.Role == "receptionist")))
                throw new ForbiddenException("Nu ai permisiunea să anulezi această programare");

            appointment.Status = "cancelled";
            appointment.CancellationReason = reason;
            appointment.CancelledBy = userId;
            appointment.CancelledAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;
            appointment.CancelledByRole = cancelledByRole;
            appointment.TimeSlot.IsAvailable = true;
            
            appointment.TimeSlot.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(userId, "CANCEL_APPOINTMENT", "Appointment", appointment.Id,
                new { OldStatus = "confirmed" }, new { NewStatus = "cancelled", reason });

            if (appointment.PatientId.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    appointment.PatientId.Value,
                    "Programare anulată",
                    "Programarea ta a fost anulată.",
                    "appointment_cancelled",
                    appointment.Id
                );
            }

            try
            {
                var patient = await _context.Users.FindAsync(appointment.PatientId);
                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.Id == appointment.DoctorId);
                var service = await _context.MedicalServices.FindAsync(appointment.ServiceId);

                if (patient != null && doctor != null && service != null && appointment.Patient != null && appointment.PatientId.HasValue)
                {
                    await _emailService.SendAppointmentCancellationAsync(
                        patient.Email,
                        patient.FirstName,
                        $"Dr. {doctor.User.FirstName} {doctor.User.LastName}",
                        service.Name,
                        appointment.TimeSlot.SlotDate.ToString("dd MMMM yyyy"),
                        appointment.TimeSlot.StartTime.ToString(@"hh\:mm"),
                        reason
                    );
                }
                
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eroare la trimiterea email-ului de anulare");
            }

            await ProcessWaitingListAsync(
                appointment.DoctorId,
                appointment.LocationId,
                appointment.ServiceId,
                appointment.TimeSlot.SlotDate,
                appointment.TimeSlot.StartTime
            );
        }

        private async Task<AppointmentDto> GetAppointmentDtoAsync(Guid appointmentId)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Doctor).ThenInclude(d => d.Specialty)
                .Include(a => a.Service)
                .Include(a => a.Location)
                .Include(a => a.TimeSlot)
                .FirstAsync(a => a.Id == appointmentId);

            return new AppointmentDto
            {
                Id = appointment.Id,
                DoctorName = $"Dr. {appointment.Doctor.User.FirstName} {appointment.Doctor.User.LastName}",
                SpecialtyName = appointment.Doctor.Specialty.Name,
                ServiceName = appointment.Service.Name,
                LocationName = appointment.Location.Name,
                SlotDate = appointment.TimeSlot.SlotDate.ToDateTime(TimeOnly.MinValue),
                StartTime = appointment.TimeSlot.StartTime.ToTimeSpan(),
                EndTime = appointment.TimeSlot.EndTime.ToTimeSpan(),
                Status = appointment.Status,
                Type = appointment.Type,
                PricePaid = appointment.PricePaid,
                PaymentStatus = appointment.PaymentStatus,
                OriginalPrice = appointment.Service.Price,
                IsCNASApplied = appointment.Service.IsCNASCovered && appointment.PricePaid < appointment.Service.Price,
                CreatedAt = appointment.CreatedAt
            };
        }
        public async Task<List<DoctorAppointmentDto>> GetDoctorAppointmentsAsync(Guid doctorId, DateOnly? date = null)
        {
            var query = _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.WalkInPatient)
                .Include(a => a.Service)
                .Include(a => a.Location)
                .Include(a => a.TimeSlot)
                .Include(a => a.MedicalRecord)
                .Where(a => a.DoctorId == doctorId)
                .AsQueryable();

            if (date.HasValue)
                query = query.Where(a => a.TimeSlot.SlotDate == date.Value);
            else
                query = query.Where(a => a.TimeSlot.SlotDate >= DateOnly.FromDateTime(DateTime.UtcNow));

            return await query
                .OrderBy(a => a.TimeSlot.SlotDate)
                .ThenBy(a => a.TimeSlot.StartTime)
                .Select(a => new DoctorAppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId ?? a.WalkInPatientId ?? Guid.Empty,
                    PatientName = a.PatientId != null
                        ? $"{a.Patient!.FirstName} {a.Patient.LastName}"
                        : $"{a.WalkInPatient!.FirstName} {a.WalkInPatient.LastName}",
                    PatientEmail = a.PatientId != null
                        ? a.Patient!.Email
                        : a.WalkInPatient!.Email ?? "-",
                    ServiceName = a.Service.Name,
                    LocationName = a.Location.Name,
                    SlotDate = a.TimeSlot.SlotDate,
                    StartTime = a.TimeSlot.StartTime,
                    EndTime = a.TimeSlot.EndTime,
                    Status = a.Status,
                    Reason = a.Reason,
                    CheckedInAt = a.CheckedInAt,
                    PaymentStatus = a.PaymentStatus,
                    PricePaid = a.PricePaid,
                    ExternalReferralUrl = a.ExternalReferralUrl,
                    HasMedicalRecord = a.MedicalRecord != null,
                    IsWalkIn = a.WalkInPatientId != null,
                })
                .ToListAsync();
        }

        public async Task CompleteAppointmentAsync(Guid appointmentId, Guid doctorId)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointmentId && a.DoctorId == doctorId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            if (appointment.Status != "confirmed")
                throw new BadRequestException("Programarea nu poate fi finalizată");

            appointment.Status = "completed";
            appointment.CompletedAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            if (appointment.PatientId.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    appointment.PatientId.Value,
                    "Consultație finalizată",
                    "Consultația ta a fost finalizată. Poți lăsa o recenzie.",
                    "appointment_completed",
                    appointment.Id
                );
            }
        }
        public async Task UploadInvestigationResultAsync(Guid investigationId, Guid patientId, string resultUrl)
        {
            var investigation = await _context.Investigations
                .FirstOrDefaultAsync(i => i.Id == investigationId && i.PatientId == patientId)
                ?? throw new NotFoundException("Investigația nu a fost găsită");

            investigation.ResultUrl = resultUrl;
            investigation.Status = "result_uploaded";
            investigation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task CompleteInvestigationAsync(Guid investigationId, Guid doctorUserId)
        {
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.UserId == doctorUserId)
                ?? throw new NotFoundException("Doctorul nu a fost găsit");

            var investigation = await _context.Investigations
                .FirstOrDefaultAsync(i => i.Id == investigationId && i.DoctorId == doctor.Id)
                ?? throw new NotFoundException("Investigația nu a fost găsită");

            investigation.Status = "completed";
            investigation.CompletedAt = DateTime.UtcNow;
            investigation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task CheckInPatientAsync(Guid appointmentId)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointmentId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            if (appointment.Status != "confirmed")
                throw new BadRequestException("Programarea nu poate fi check-in-uită");

            appointment.CheckedInAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            if (appointment.PatientId.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    appointment.PatientId.Value,
                    "Check-in confirmat",
                    "Sosirea ta a fost confirmată. Vei fi chemat în curând.",
                    "check_in",
                    appointment.Id
                );
            }
        }

        public async Task ProcessPaymentAsync(Guid appointmentId, string paymentMethod)
        {
            var appointment = await _context.Appointments
                .Include(a => a.InvoiceItems)
                .FirstOrDefaultAsync(a => a.Id == appointmentId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            if (appointment.Status != "completed")
                throw new BadRequestException("Plata se poate procesa doar după finalizarea consultației");

            var totalAmount = appointment.InvoiceItems.Any()
                ? appointment.InvoiceItems.Sum(i => i.TotalPrice)
                : appointment.PricePaid;

            appointment.PaymentStatus = "paid";
            appointment.PaymentMethod = paymentMethod;
            appointment.PricePaid = totalAmount;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            if (appointment.PatientId.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    appointment.PatientId.Value,
                    "Plată confirmată",
                    $"Plata de {totalAmount} lei a fost procesată cu succes.",
                    "payment_confirmed",
                    appointment.Id
                );
            }
        }

        public async Task<PagedResultDto<DoctorAppointmentDto>> GetTodayAppointmentsAsync(ReceptionFilterDto filter)
        {
            var query = _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Service)
                .Include(a => a.Location)
                .Include(a => a.TimeSlot)
                .Include(a => a.WalkInPatient)
                .Include(a => a.MedicalRecord)
                .Include(a => a.Doctor).ThenInclude(d => d.Specialty)
                .Where(a => a.TimeSlot.SlotDate == filter.Date)
                .AsQueryable();

            if (filter.LocationId.HasValue)
                query = query.Where(a => a.LocationId == filter.LocationId);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(a => a.Status == filter.Status);

            if (filter.DoctorId.HasValue)
                query = query.Where(a => a.DoctorId == filter.DoctorId);

            if (filter.SpecialtyId.HasValue)
                query = query.Where(a => a.Doctor.SpecialtyId == filter.SpecialtyId);

            if (!string.IsNullOrEmpty(filter.SearchName))
            {
                var search = filter.SearchName.ToLower();
                query = query.Where(a =>
                    (a.Patient != null && (
                        a.Patient.FirstName.ToLower().Contains(search) ||
                        a.Patient.LastName.ToLower().Contains(search)
                    )) ||
                    (a.WalkInPatient != null && (
                        a.WalkInPatient.FirstName.ToLower().Contains(search) ||
                        a.WalkInPatient.LastName.ToLower().Contains(search)
                    ))
                );
            }

            if (filter.FromTime.HasValue)
                query = query.Where(a => a.TimeSlot.StartTime >= filter.FromTime.Value);

            if (filter.ToTime.HasValue)
                query = query.Where(a => a.TimeSlot.StartTime <= filter.ToTime.Value);

            var totalCount = await query.CountAsync();

            var appointments = await query
                .OrderBy(a => a.TimeSlot.StartTime)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(a => new DoctorAppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId ?? a.WalkInPatientId ?? Guid.Empty,
                    PatientName = a.PatientId != null
                    
                        ? $"{a.Patient!.FirstName} {a.Patient.LastName}"
                        : $"{a.WalkInPatient!.FirstName} {a.WalkInPatient.LastName}",
                    PatientEmail = a.PatientId != null
                        ? a.Patient!.Email
                        : a.WalkInPatient!.Email ?? "-",
                    ServiceName = a.Service.Name,
                    LocationName = a.Location.Name,
                    SlotDate = a.TimeSlot.SlotDate,
                    StartTime = a.TimeSlot.StartTime,
                    EndTime = a.TimeSlot.EndTime,
                    Status = a.Status,
                    Reason = a.Reason,
                    PricePaid = a.PricePaid,
                    HasMedicalRecord = a.MedicalRecord != null,
                    CheckedInAt = a.CheckedInAt,
                    ExternalReferralUrl = a.ExternalReferralUrl,
                    DoctorName = $"Dr. {a.Doctor.User.FirstName} {a.Doctor.User.LastName}",
                    SpecialtyName = a.Doctor.Specialty.Name,
                    PaymentStatus = a.PaymentStatus,
                    IsWalkIn = a.WalkInPatientId != null,
                })
                .ToListAsync();

            return new PagedResultDto<DoctorAppointmentDto>
            {
                Items = appointments,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }
        public async Task<AppointmentDto> CreateAppointmentForPatientAsync(ReceptionCreateAppointmentDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var slot = await _context.TimeSlots
                    .FromSqlRaw("SELECT * FROM \"TimeSlots\" WHERE \"Id\" = {0} FOR UPDATE", dto.TimeSlotId)
                    .FirstOrDefaultAsync();
                if (slot == null || !slot.IsAvailable || slot.IsBlocked)
                    throw new ConflictException("Slot indisponibil");

                var service = await _context.MedicalServices
                    .FirstOrDefaultAsync(s => s.Id == dto.ServiceId)
                    ?? throw new NotFoundException("Serviciu negăsit");

                var finalPrice = service.Price;
                var today = DateOnly.FromDateTime(DateTime.UtcNow);

                Guid? patientId = null;
                Guid? walkInPatientId = null;

                if (!string.IsNullOrEmpty(dto.PatientEmail))
                {
                    var patient = await _context.Users
                        .FirstOrDefaultAsync(u => u.Email == dto.PatientEmail && u.IsActive)
                        ?? throw new NotFoundException("Pacientul nu a fost găsit");

                    patientId = patient.Id;

                    if (service.IsCNASCovered)
                    {
                        var validCard = await _context.InsuranceCards
                            .FirstOrDefaultAsync(c =>
                                c.PatientId == patient.Id &&
                                c.IsActive && c.IsVerified &&
                                c.ExpiryDate >= today);
                        if (validCard != null)
                        {
                            var cnasAmount = service.CNASCoveredAmount ?? service.Price;
                            finalPrice = Math.Max(0, service.Price - cnasAmount);
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(dto.WalkInCNP))
                {
                    var walkIn = await _context.WalkInPatients
                        .FirstOrDefaultAsync(w => w.CNP == dto.WalkInCNP)
                        ?? throw new NotFoundException("Pacientul walk-in nu a fost găsit");

                    walkInPatientId = walkIn.Id;

                    if (service.IsCNASCovered)
                    {
                        var validCard = await _context.InsuranceCards
                            .FirstOrDefaultAsync(c =>
                                c.WalkInPatientId == walkIn.Id &&
                                c.IsActive && c.IsVerified &&
                                c.ExpiryDate >= today);
                        if (validCard != null)
                        {
                            var cnasAmount = service.CNASCoveredAmount ?? service.Price;
                            finalPrice = Math.Max(0, service.Price - cnasAmount);
                        }
                    }
                }
                else
                {
                    throw new InvalidOperationException("Trebuie specificat email pacient sau CNP walk-in");
                }
                

                var appointment = new Appointment
                {
                    Id = Guid.NewGuid(),
                    PatientId = patientId,
                    WalkInPatientId = walkInPatientId,
                    DoctorId = dto.DoctorId,
                    ServiceId = dto.ServiceId,
                    LocationId = dto.LocationId,
                    TimeSlotId = dto.TimeSlotId,
                    Status = "confirmed",
                    Type = "in_person",
                    Reason = dto.Reason,
                    PricePaid = finalPrice,
                    PaymentStatus = "unpaid",
                    ConfirmedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                slot.IsAvailable = false;
                slot.UpdatedAt = DateTime.UtcNow;
                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (patientId.HasValue)
                {
                    var patient = await _context.Users.FindAsync(patientId);
                    await _notificationService.CreateNotificationAsync(
                        patientId.Value,
                        "Programare confirmată",
                        $"Programarea ta a fost confirmată pentru {slot.SlotDate} la ora {slot.StartTime}.",
                        "appointment_confirmed",
                        appointment.Id
                    );

                    try
                    {
                        var doctor = await _context.Doctors
                            .Include(d => d.User)
                            .FirstOrDefaultAsync(d => d.Id == dto.DoctorId);
                        var location = await _context.Locations.FindAsync(dto.LocationId);

                        if (patient != null && doctor != null && location != null)
                        {
                            await _emailService.SendAppointmentConfirmationAsync(
                                patient.Email,
                                patient.FirstName,
                                $"Dr. {doctor.User.FirstName} {doctor.User.LastName}",
                                service.Name,
                                slot.SlotDate.ToString("dd MMMM yyyy"),
                                slot.StartTime.ToString(@"hh\:mm"),
                                location.Name
                            );
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Eroare la trimiterea email-ului de confirmare");
                    }
                }
                else if (walkInPatientId.HasValue)
                {
                    var walkIn = await _context.WalkInPatients.FindAsync(walkInPatientId);
                    if (walkIn?.Email != null)
                    {
                        try
                        {
                            var doctor = await _context.Doctors
                                .Include(d => d.User)
                                .FirstOrDefaultAsync(d => d.Id == dto.DoctorId);
                            var location = await _context.Locations.FindAsync(dto.LocationId);

                            if (doctor != null && location != null)
                            {
                                await _emailService.SendAppointmentConfirmationAsync(
                                    walkIn.Email,
                                    walkIn.FirstName,
                                    $"Dr. {doctor.User.FirstName} {doctor.User.LastName}",
                                    service.Name,
                                    slot.SlotDate.ToString("dd MMMM yyyy"),
                                    slot.StartTime.ToString(@"hh\:mm"),
                                    location.Name
                                );
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Eroare la trimiterea email-ului walk-in");
                        }
                    }
                }

                return await GetAppointmentDtoAsync(appointment.Id);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<Guid>> GetAvailableLocationIdsAsync(Guid doctorId, Guid serviceId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            return await _context.TimeSlots
                .Where(t =>
                    t.DoctorId == doctorId &&
                    t.SlotDate >= today &&
                    t.IsAvailable &&
                    !t.IsBlocked &&
                    (t.ServiceId == serviceId || t.ServiceId == null))
                .Select(t => t.LocationId)
                .Distinct()
                .ToListAsync();
        }

        public async Task UploadExternalReferralAsync(Guid appointmentId, Guid patientId, string fileUrl)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointmentId && a.PatientId == patientId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            appointment.ExternalReferralUrl = fileUrl;
            appointment.Status = "pending_referral_verification";
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task ApproveExternalReferralAsync(Guid appointmentId)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointmentId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            appointment.Status = "confirmed";
            appointment.ConfirmedAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task RejectExternalReferralAsync(Guid appointmentId, string reason)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == appointmentId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            appointment.Status = "cancelled";
            appointment.CancellationReason = $"Referral respins: {reason}";
            appointment.CancelledAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<PagedResultDto<DoctorAppointmentDto>> GetPendingReferralsAsync(int page, int pageSize)
        {
            var query = _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Service)
                .Include(a => a.Location)
                .Include(a => a.TimeSlot)
                .Include(a => a.MedicalRecord)
                .Where(a => a.Status == "pending_referral_verification")
                .OrderBy(a => a.TimeSlot.SlotDate)
                .ThenBy(a => a.TimeSlot.StartTime);

            var totalCount = await query.CountAsync();

            var appointments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new DoctorAppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId!.Value,
                    PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                    PatientEmail = a.Patient.Email,
                    ServiceName = a.Service.Name,
                    LocationName = a.Location.Name,
                    SlotDate = a.TimeSlot.SlotDate,
                    StartTime = a.TimeSlot.StartTime,
                    EndTime = a.TimeSlot.EndTime,
                    Status = a.Status,
                    Reason = a.Reason,
                    PricePaid = a.PricePaid,
                    HasMedicalRecord = a.MedicalRecord != null,
                    CheckedInAt = a.CheckedInAt,
                    PaymentStatus = a.PaymentStatus,
                    ExternalReferralUrl = a.ExternalReferralUrl
                })
                .ToListAsync();

            return new PagedResultDto<DoctorAppointmentDto>
            {
                Items = appointments,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<List<Guid>> GetDoctorIdsForDateAsync(DateOnly date)
        {
            return await _context.Appointments
                .Where(a => a.TimeSlot.SlotDate == date)
                .Select(a => a.DoctorId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<List<Guid>> GetSpecialtyIdsForDateAsync(DateOnly date)
        {
            return await _context.Appointments
                .Where(a => a.TimeSlot.SlotDate == date)
                .Select(a => a.Doctor.SpecialtyId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<WaitingListEntryDto> AddToWaitingListAsync(Guid patientId, AddToWaitingListDto dto)
        {
            var existing = await _context.WaitingLists
                .AnyAsync(w =>
                    w.PatientId == patientId &&
                    w.DoctorId == dto.DoctorId &&
                    w.ServiceId == dto.ServiceId &&
                    w.Status == "waiting");

            if (existing)
                throw new ConflictException("Ești deja pe lista de așteptare pentru acest doctor și serviciu");

            var entry = new WaitingList
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = dto.DoctorId,
                ServiceId = dto.ServiceId,
                LocationId = dto.LocationId,
                PreferredDateFrom = dto.PreferredDateFrom,
                PreferredDateTo = dto.PreferredDateTo,
                PreferredTimeOfDay = dto.PreferredTimeOfDay,
                Status = "waiting",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.WaitingLists.Add(entry);
            await _context.SaveChangesAsync();

            return await MapWaitingListToDto(entry.Id);
        }

        public async Task<List<WaitingListEntryDto>> GetPatientWaitingListAsync(Guid patientId)
        {
            return await _context.WaitingLists
                .Include(w => w.Doctor).ThenInclude(d => d.User)
                .Include(w => w.Service)
                .Include(w => w.Location)
                .Where(w => w.PatientId == patientId)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new WaitingListEntryDto
                {
                    Id = w.Id,
                    DoctorName = $"Dr. {w.Doctor.User.FirstName} {w.Doctor.User.LastName}",
                    ServiceName = w.Service.Name,
                    LocationName = w.Location.Name,
                    PreferredDateFrom = w.PreferredDateFrom,
                    PreferredDateTo = w.PreferredDateTo,
                    PreferredTimeOfDay = w.PreferredTimeOfDay,
                    Status = w.Status,
                    NotifiedAt = w.NotifiedAt,
                    CreatedAt = w.CreatedAt
                })
                .ToListAsync();
        }

        public async Task RemoveFromWaitingListAsync(Guid id, Guid patientId)
        {
            var entry = await _context.WaitingLists
                .FirstOrDefaultAsync(w => w.Id == id && w.PatientId == patientId)
                ?? throw new NotFoundException("Înregistrarea nu a fost găsită");

            _context.WaitingLists.Remove(entry);
            await _context.SaveChangesAsync();
        }

        public async Task ProcessWaitingListAsync(Guid doctorId, Guid locationId, Guid? serviceId, DateOnly slotDate, TimeOnly startTime)
        {
            var waitingEntries = await _context.WaitingLists
                .Include(w => w.Patient)
                .Where(w =>
                    w.DoctorId == doctorId &&
                    w.LocationId == locationId &&
                    (serviceId == null || w.ServiceId == serviceId) &&
                    w.Status == "waiting" &&
                    w.PreferredDateFrom <= slotDate &&
                    w.PreferredDateTo >= slotDate)
                .OrderBy(w => w.CreatedAt)
                .ToListAsync();

            foreach (var entry in waitingEntries)
            {
                await _notificationService.CreateNotificationAsync(
                    entry.PatientId,
                    "Slot disponibil!",
                    $"S-a eliberat un slot pe {slotDate} la ora {startTime}. Intră în aplicație pentru a te programa.",
                    "waiting_list_slot_available"
                );

                try
                {
                    var doctor = await _context.Doctors
                        .Include(d => d.User)
                        .FirstOrDefaultAsync(d => d.Id == doctorId);

                    var service = serviceId.HasValue
                        ? await _context.MedicalServices.FindAsync(serviceId)
                        : null;

                    if (entry.Patient != null && doctor != null)
                    {
                        await _emailService.SendWaitingListNotificationAsync(
                            entry.Patient.Email,
                            entry.Patient.FirstName,
                            $"Dr. {entry.Doctor.User.FirstName} {entry.Doctor.User.LastName}",
                            entry.Service?.Name ?? "Consultație",
                            entry.NotifiedSlotDate?.ToString("dd MMMM yyyy") ?? "—",
                            entry.NotifiedSlotTime?.ToString(@"hh\:mm") ?? "—"
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la trimiterea email-ului waiting list");
                }

                entry.Status = "notified";
                entry.NotifiedAt = DateTime.UtcNow;
                entry.UpdatedAt = DateTime.UtcNow;
                break;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> DoctorHasAnySlotsAsync(Guid doctorId, Guid locationId, Guid? serviceId = null)
        {
            var query = _context.TimeSlots
                .Where(t =>
                    t.DoctorId == doctorId &&
                    t.LocationId == locationId);

            if (serviceId.HasValue)
                query = query.Where(t => t.ServiceId == serviceId || t.ServiceId == null);

            return await query.AnyAsync();
        }

        public async Task<DateOnly?> GetFirstAvailableDateAsync(Guid doctorId, Guid locationId, Guid? serviceId = null, DateOnly? afterDate = null)
        {
            var startDate = afterDate.HasValue ? afterDate.Value.AddDays(1) : DateOnly.FromDateTime(DateTime.UtcNow);

            var query = _context.TimeSlots
                .Where(t =>
                    t.DoctorId == doctorId &&
                    t.LocationId == locationId &&
                    t.SlotDate >= startDate &&
                    t.IsAvailable &&
                    !t.IsBlocked);

            if (serviceId.HasValue)
                query = query.Where(t => t.ServiceId == serviceId || t.ServiceId == null);

            var firstDate = await query
                .OrderBy(t => t.SlotDate)
                .ThenBy(t => t.StartTime)
                .Select(t => t.SlotDate)
                .FirstOrDefaultAsync();

            return firstDate == default ? null : firstDate;
        }
        public async Task<List<DoctorCalendarDayDto>> GetDoctorCalendarAsync(Guid doctorId, Guid locationId, Guid? serviceId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var sixtyDaysLater = today.AddDays(60);

            var query = _context.TimeSlots
                .Where(t =>
                    t.DoctorId == doctorId &&
                    t.LocationId == locationId &&
                    t.SlotDate >= today &&
                    t.SlotDate <= sixtyDaysLater &&
                    !t.IsBlocked);

            if (serviceId.HasValue)
                query = query.Where(t => t.ServiceId == serviceId || t.ServiceId == null);

            var slots = await query
                .GroupBy(t => t.SlotDate)
                .Select(g => new DoctorCalendarDayDto
                {
                    Date = g.Key,
                    TotalSlots = g.Count(),
                    AvailableSlots = g.Count(t => t.IsAvailable),
                })
                .OrderBy(d => d.Date)
                .ToListAsync();

            return slots;
        }
        public async Task<List<Guid>> GetDoctorLocationsByServiceAsync(Guid doctorId, Guid serviceId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            return await _context.TimeSlots
                .Where(t =>
                    t.DoctorId == doctorId &&
                    t.SlotDate >= today &&
                    !t.IsBlocked &&
                    (t.ServiceId == serviceId || t.ServiceId == null))
                .Select(t => t.LocationId)
                .Distinct()
                .ToListAsync();
        }

        private async Task<WaitingListEntryDto> MapWaitingListToDto(Guid id)
        {
            return await _context.WaitingLists
                .Include(w => w.Doctor).ThenInclude(d => d.User)
                .Include(w => w.Service)
                .Include(w => w.Location)
                .Where(w => w.Id == id)
                .Select(w => new WaitingListEntryDto
                {
                    Id = w.Id,
                    DoctorName = $"Dr. {w.Doctor.User.FirstName} {w.Doctor.User.LastName}",
                    ServiceName = w.Service.Name,
                    LocationName = w.Location.Name,
                    PreferredDateFrom = w.PreferredDateFrom,
                    PreferredDateTo = w.PreferredDateTo,
                    PreferredTimeOfDay = w.PreferredTimeOfDay,
                    Status = w.Status,
                    NotifiedAt = w.NotifiedAt,
                    CreatedAt = w.CreatedAt
                })
                .FirstAsync();
        }


    }
}
