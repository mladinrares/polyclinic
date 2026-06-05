using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class MedicalRecord : BaseEntity
    {
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid AppointmentId { get; set; }
        public string Diagnosis { get; set; } = string.Empty;
        public string? Anamnesis { get; set; }
        public string? ExaminationNotes { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? Recommendations { get; set; }
        public DateTime RecordDate { get; set; }

        // Relatii
        public User Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public Appointment Appointment { get; set; } = null!;
        public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
        public ICollection<Investigation> Investigations { get; set; } = new List<Investigation>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}
