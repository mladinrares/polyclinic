using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Referrals
{
    public class CreateReferralDto
    {
        public Guid PatientId { get; set; }
        public Guid SpecialtyId { get; set; }
        public Guid ServiceId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public int ValidDays { get; set; } = 30;
    }
}
