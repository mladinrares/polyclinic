using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Referral : BaseEntity
    {
        public Guid PatientId { get; set; }
        public Guid ReferringDoctorId { get; set; }
        public Guid ReferredSpecialtyId { get; set; }
        public Guid ReferredServiceId { get; set; }
        public string ReferralNumber { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateOnly ValidFrom { get; set; }
        public DateOnly ValidUntil { get; set; }
        public string Status { get; set; } = "active";

        // Relatii
        public User Patient { get; set; } = null!;
        public Doctor ReferringDoctor { get; set; } = null!;
        public Specialty ReferredSpecialty { get; set; } = null!;
        public MedicalService ReferredService { get; set; } = null!;
    }
}
