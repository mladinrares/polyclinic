using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Document : BaseEntity
    {
        public Guid PatientId { get; set; }
        public Guid? AppointmentId { get; set; }
        public Guid? MedicalRecordId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string? FileSize { get; set; }
        public string? MimeType { get; set; }

        // Relatii
        public User Patient { get; set; } = null!;
        public Appointment? Appointment { get; set; }
        public MedicalRecord? MedicalRecord { get; set; }
    }
}
