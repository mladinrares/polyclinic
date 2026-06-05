using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class PatientConsent : BaseEntity
    {
        public Guid PatientId { get; set; }
        public string ConsentType { get; set; } = string.Empty;
        public bool IsGranted { get; set; }
        public string Version { get; set; } = string.Empty;
        public DateTime? GrantedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public string? IpAddress { get; set; }

        // Relatii
        public User Patient { get; set; } = null!;
    }
}
