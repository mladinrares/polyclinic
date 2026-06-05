using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Medical
{
    public class MedicalRecordDto
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string? Anamnesis { get; set; }
        public string? ExaminationNotes { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? Recommendations { get; set; }
        public DateTime RecordDate { get; set; }
        public List<PrescriptionDto> Prescriptions { get; set; } = new();
        public List<InvestigationDto> Investigations { get; set; } = new();
    }
}
