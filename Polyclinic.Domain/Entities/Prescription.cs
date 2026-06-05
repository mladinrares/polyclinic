using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Prescription : BaseEntity
    {
        public Guid MedicalRecordId { get; set; }
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public string PrescriptionNumber { get; set; } = string.Empty;
        public DateOnly ValidFrom { get; set; }
        public DateOnly ValidUntil { get; set; }
        public string Status { get; set; } = "active";

        // Relatii
        public MedicalRecord MedicalRecord { get; set; } = null!;
        public User Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
    }
}
