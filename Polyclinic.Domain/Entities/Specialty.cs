using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Specialty : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        public bool IsActive { get; set; } = true;

        // Relatii
        public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
        public ICollection<MedicalService> MedicalServices { get; set; } = new List<MedicalService>();
        public ICollection<Referral> Referrals { get; set; } = new List<Referral>();
    }
}
