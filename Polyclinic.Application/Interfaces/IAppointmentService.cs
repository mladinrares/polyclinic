using Polyclinic.Application.DTOs.Appointments;
using Polyclinic.Application.DTOs.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IAppointmentService
    {
        Task<List<TimeSlotDto>> GetAvailableSlotsAsync(Guid doctorId, Guid locationId, DateOnly date, Guid? serviceId = null);
        Task<AppointmentDto> CreateAppointmentAsync(Guid patientId, CreateAppointmentDto dto);
        Task<PagedResultDto<AppointmentDto>> GetPatientAppointmentsAsync(Guid patientId, int page, int pageSize);
        Task<List<DoctorCalendarDayDto>> GetDoctorCalendarAsync(Guid doctorId, Guid locationId, Guid? serviceId);
        Task CancelAppointmentAsync(Guid appointmentId, Guid userId, string reason, string? CancelledByRole = null);
        Task<List<DoctorAppointmentDto>> GetDoctorAppointmentsAsync(Guid doctorId, DateOnly? date = null);
        Task CompleteAppointmentAsync(Guid appointmentId, Guid doctorId);
        Task UploadInvestigationResultAsync(Guid investigationId, Guid patientId, string resultUrl);
        Task CompleteInvestigationAsync(Guid investigationId, Guid doctorUserId);
        Task CheckInPatientAsync(Guid appointmentId);
        Task ProcessPaymentAsync(Guid appointmentId, string paymentMethod);
        Task<PagedResultDto<DoctorAppointmentDto>> GetTodayAppointmentsAsync(ReceptionFilterDto filter);
        Task<AppointmentDto> CreateAppointmentForPatientAsync(ReceptionCreateAppointmentDto dto);
        
        Task<List<Guid>> GetAvailableLocationIdsAsync(Guid doctorId, Guid serviceId);
        Task<PagedResultDto<DoctorAppointmentDto>> GetPendingReferralsAsync(int page, int pageSize);

        Task UploadExternalReferralAsync(Guid appointmentId, Guid patientId, string fileUrl);
        Task ApproveExternalReferralAsync(Guid appointmentId);
        Task RejectExternalReferralAsync(Guid appointmentId, string reason);

        Task<List<Guid>> GetDoctorIdsForDateAsync(DateOnly date);
        Task<List<Guid>> GetSpecialtyIdsForDateAsync(DateOnly date);
        Task<WaitingListEntryDto> AddToWaitingListAsync(Guid patientId, AddToWaitingListDto dto);
        Task<List<WaitingListEntryDto>> GetPatientWaitingListAsync(Guid patientId);
        Task RemoveFromWaitingListAsync(Guid id, Guid patientId);
        Task ProcessWaitingListAsync(Guid doctorId, Guid locationId, Guid? serviceId, DateOnly slotDate, TimeOnly startTime);

        Task<bool> DoctorHasAnySlotsAsync(Guid doctorId, Guid locationId, Guid? serviceId = null);

        Task<DateOnly?> GetFirstAvailableDateAsync(Guid doctorId, Guid locationId, Guid? serviceId = null, DateOnly? afterDate = null);
        Task<List<Guid>> GetDoctorLocationsByServiceAsync(Guid doctorId, Guid serviceId);
    }
}
