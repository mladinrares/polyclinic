using Polyclinic.Application.DTOs.Admin;
using Polyclinic.Application.DTOs.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IAdminService
    {
        // Statistici
        Task<AdminStatsDto> GetStatsAsync();

        // Doctori
        Task<DoctorDto> CreateDoctorAsync(CreateDoctorDto dto);
        Task<DoctorDto> UpdateDoctorAsync(Guid id, UpdateDoctorDto dto);
        Task DeleteDoctorAsync(Guid id);
        Task<List<DoctorDto>> GetAllDoctorsAsync(bool includeInactive = false);

        // Specialitati
        Task<List<SpecialtyDto>> GetSpecialtiesAsync(bool includeInactive = false);
        Task<SpecialtyDto> CreateSpecialtyAsync(CreateSpecialtyDto dto);
        Task DeleteSpecialtyAsync(Guid id);

        // Locatii
        Task<List<LocationDto>> GetLocationsAsync(bool includeInactive = false);
        Task<LocationDto> CreateLocationAsync(CreateLocationDto dto);
        Task DeleteLocationAsync(Guid id);

        Task<List<MedicalServiceDto>> GetServicesAsync(bool includeInactive = false);
        Task<MedicalServiceDto> CreateServiceAsync(CreateMedicalServiceDto dto);
        Task DeleteServiceAsync(Guid id);
        Task AddServiceToDoctorAsync(Guid doctorId, Guid serviceId);
        Task RemoveServiceFromDoctorAsync(Guid doctorId, Guid serviceId);

        Task<List<DoctorScheduleDto>> GetDoctorSchedulesAsync(Guid doctorId);
        Task<DoctorScheduleDto> CreateDoctorScheduleAsync(CreateDoctorScheduleDto dto);
        Task DeleteDoctorScheduleAsync(Guid id);
        Task GenerateSlotsFromScheduleAsync(Guid doctorId, int daysAhead = 30);

        Task ReactivateDoctorAsync(Guid id);
        Task ReactivateSpecialtyAsync(Guid id);
        Task ReactivateLocationAsync(Guid id);
        Task ReactivateServiceAsync(Guid id);

        Task<MedicalServiceDto> UpdateServiceAsync(Guid id, CreateMedicalServiceDto dto);
        Task<SpecialtyDto> UpdateSpecialtyAsync(Guid id, CreateSpecialtyDto dto);
        Task<LocationDto> UpdateLocationAsync(Guid id, CreateLocationDto dto);

        Task<List<MonthlyStatsDto>> GetMonthlyStatsAsync();
        Task<List<SlotsByDateDto>> GetDoctorSlotsCalendarAsync(Guid doctorId);
        Task DeleteSlotsByTimeAsync(Guid doctorId, DateOnly date, TimeOnly time, string cancelReason);
        Task DeleteSlotsByDateAsync(Guid doctorId, DateOnly date, string cancelReason);
        Task GenerateSlotsAsync(Guid doctorId, int days);


    }
}
