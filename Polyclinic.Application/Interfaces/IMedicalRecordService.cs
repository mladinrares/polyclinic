using Polyclinic.Application.DTOs.Medical;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{

    public interface IMedicalRecordService
    {
        Task<MedicalRecordDto> CreateMedicalRecordAsync(Guid doctorId, CreateMedicalRecordDto dto);
        Task<MedicalRecordDto> GetMedicalRecordByAppointmentAsync(Guid appointmentId, Guid userId);
        Task<List<MedicalRecordDto>> GetPatientMedicalHistoryAsync(Guid patientId);
        Task<List<MedicalRecordDto>> GetPatientHistoryForDoctorAsync(Guid patientId, Guid doctorId);
    }
}
