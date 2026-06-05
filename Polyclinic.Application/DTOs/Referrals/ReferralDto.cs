using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Referrals
{
    public class ReferralDto
    {
        public Guid Id { get; set; }
        public string ReferralNumber { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string ReferringDoctorName { get; set; } = string.Empty;
        public string SpecialtyName { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateOnly ValidFrom { get; set; }
        public DateOnly ValidUntil { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
