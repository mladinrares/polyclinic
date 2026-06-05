using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Medical;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;

namespace Polyclinic.Infrastructure.Services
{



    public class MedicalRecordService : IMedicalRecordService
    {
        private readonly PolyclinicDbContext _context;

        public MedicalRecordService(PolyclinicDbContext context)
        {
            _context = context;
        }

        public async Task<MedicalRecordDto> CreateMedicalRecordAsync(Guid doctorId, CreateMedicalRecordDto dto)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId && a.DoctorId == doctorId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            if (appointment.Status != "completed")
                throw new BadRequestException("Poți adăuga fișă medicală doar după finalizarea consultației");

            var existingRecord = await _context.MedicalRecords
                .AnyAsync(m => m.AppointmentId == dto.AppointmentId);

            if (existingRecord)
                throw new ConflictException("Fișa medicală există deja pentru această programare");
            
            var medicalRecord = new MedicalRecord
            {
                Id = Guid.NewGuid(),
                PatientId = appointment.PatientId!.Value,
                DoctorId = doctorId,
                AppointmentId = dto.AppointmentId,
                Diagnosis = dto.Diagnosis,
                Anamnesis = dto.Anamnesis,
                ExaminationNotes = dto.ExaminationNotes,
                TreatmentPlan = dto.TreatmentPlan,
                Recommendations = dto.Recommendations,
                RecordDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MedicalRecords.Add(medicalRecord);

            if (dto.PrescriptionItems.Any())
            {
                var prescription = new Prescription
                {
                    Id = Guid.NewGuid(),
                    MedicalRecordId = medicalRecord.Id,
                    PatientId = appointment.PatientId.Value,
                    DoctorId = doctorId,
                    PrescriptionNumber = $"RX-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                    ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                    ValidUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                    Status = "active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                prescription.Items = dto.PrescriptionItems.Select(item => new PrescriptionItem
                {
                    Id = Guid.NewGuid(),
                    PrescriptionId = prescription.Id,
                    MedicationName = item.MedicationName,
                    Dosage = item.Dosage,
                    Frequency = item.Frequency,
                    Duration = item.Duration,
                    Instructions = item.Instructions,
                    Quantity = item.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }).ToList();

                _context.Prescriptions.Add(prescription);
            }

            foreach (var inv in dto.Investigations)
            {
                _context.Investigations.Add(new Investigation
                {
                    Id = Guid.NewGuid(),
                    MedicalRecordId = medicalRecord.Id,
                    PatientId = appointment.PatientId.Value,
                    DoctorId = doctorId,
                    Type = inv.Type,
                    Name = inv.Name,
                    Notes = inv.Notes,
                    Status = "requested",
                    RequestedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            return await GetMedicalRecordByAppointmentAsync(dto.AppointmentId, doctorId);
        }

        public async Task<MedicalRecordDto> GetMedicalRecordByAppointmentAsync(Guid appointmentId, Guid userId)
        {
            var record = await _context.MedicalRecords
                .Include(m => m.Patient)
                .Include(m => m.Doctor).ThenInclude(d => d.User)
                .Include(m => m.Prescriptions).ThenInclude(p => p.Items)
                .Include(m => m.Investigations)
                .FirstOrDefaultAsync(m => m.AppointmentId == appointmentId)
                ?? throw new NotFoundException("Fișa medicală nu a fost găsită");

            if (record.PatientId != userId && record.DoctorId != userId)
                throw new ForbiddenException("Nu ai acces la această fișă medicală");

            return MapToDto(record);
        }

        public async Task<List<MedicalRecordDto>> GetPatientMedicalHistoryAsync(Guid patientId)
        {
            var records = await _context.MedicalRecords
                .Include(m => m.Patient)
                .Include(m => m.Doctor).ThenInclude(d => d.User)
                .Include(m => m.Prescriptions).ThenInclude(p => p.Items)
                .Include(m => m.Investigations)
                .Where(m => m.PatientId == patientId)
                .OrderByDescending(m => m.RecordDate)
                .ToListAsync();

            return records.Select(MapToDto).ToList();
        }

        public async Task<List<MedicalRecordDto>> GetPatientHistoryForDoctorAsync(Guid patientId, Guid doctorId)
        {
            var records = await _context.MedicalRecords
                .Include(m => m.Patient)
                .Include(m => m.Doctor).ThenInclude(d => d.User)
                .Include(m => m.Prescriptions).ThenInclude(p => p.Items)
                .Include(m => m.Investigations)
                .Where(m => m.PatientId == patientId && m.DoctorId == doctorId)
                .OrderByDescending(m => m.RecordDate)
                .ToListAsync();

            return records.Select(MapToDto).ToList();
        }

        private MedicalRecordDto MapToDto(MedicalRecord record)
        {
            return new MedicalRecordDto
            {
                Id = record.Id,
                AppointmentId = record.AppointmentId,
                PatientName = $"{record.Patient.FirstName} {record.Patient.LastName}",
                DoctorName = $"Dr. {record.Doctor.User.FirstName} {record.Doctor.User.LastName}",
                Diagnosis = record.Diagnosis,
                Anamnesis = record.Anamnesis,
                ExaminationNotes = record.ExaminationNotes,
                TreatmentPlan = record.TreatmentPlan,
                Recommendations = record.Recommendations,
                RecordDate = record.RecordDate,
                
                Prescriptions = record.Prescriptions.Select(p => new PrescriptionDto
                {
                    Id = p.Id,
                    PrescriptionNumber = p.PrescriptionNumber,
                    ValidFrom = p.ValidFrom,
                    ValidUntil = p.ValidUntil,
                    Status = p.Status,
                    Items = p.Items.Select(i => new PrescriptionItemDto
                    {
                        MedicationName = i.MedicationName,
                        Dosage = i.Dosage,
                        Frequency = i.Frequency,
                        Duration = i.Duration,
                        Instructions = i.Instructions,
                        Quantity = i.Quantity
                    }).ToList()
                }).ToList(),
                Investigations = record.Investigations.Select(i => new InvestigationDto
                {
                    Id = i.Id,
                    Type = i.Type,
                    Name = i.Name,
                    Status = i.Status,
                    Notes = i.Notes,
                    RequestedAt = i.RequestedAt,
                    CompletedAt = i.CompletedAt,
                    ResultUrl = i.ResultUrl
                }).ToList()
            };
        }

    }
}
