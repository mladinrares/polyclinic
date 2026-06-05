using Polyclinic.Application.DTOs;
using Polyclinic.Application.DTOs.Doctors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IDoctorService
    {
        Task<PagedResultDto<DoctorDto>> GetDoctorsAsync(DoctorFilterDto filter);
        Task<DoctorDto> GetDoctorByIdAsync(Guid id);
        Task<List<MedicalServiceDto>> GetDoctorServicesAsync(Guid doctorId);
        Task<List<SpecialtyDto>> GetSpecialtiesAsync();
        Task<List<LocationDto>> GetLocationsAsync();
        Task<List<MedicalServiceDto>> GetAllDoctorServicesAsync(Guid doctorId);
        Task<List<MedicalServiceDto>> GetDoctorServicesByLocationAsync(Guid doctorId, Guid locationId);
        Task<List<MedicalServiceDto>> GetServicesBySpecialtyAsync(Guid specialtyId);
        Task<List<MedicalServiceDto>> GetCNASServicesAsync();
        public Task<PublicStatsDto> GetPublicStatsAsync();
        
    }
}
