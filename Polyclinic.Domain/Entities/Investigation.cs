using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Investigation : BaseEntity
    {
        public Guid MedicalRecordId { get; set; }
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "requested";
        public string? Notes { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? ResultUrl { get; set; }

        // Relatii
        public MedicalRecord MedicalRecord { get; set; } = null!;
        public User Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
    }
}
