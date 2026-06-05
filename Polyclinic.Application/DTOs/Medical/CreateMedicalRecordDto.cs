using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Medical
{
    public class CreateMedicalRecordDto
    {
        public Guid AppointmentId { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public string? Anamnesis { get; set; }
        public string? ExaminationNotes { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? Recommendations { get; set; }
        public List<CreatePrescriptionItemDto> PrescriptionItems { get; set; } = new();
        public List<CreateInvestigationDto> Investigations { get; set; } = new();
    }
}
