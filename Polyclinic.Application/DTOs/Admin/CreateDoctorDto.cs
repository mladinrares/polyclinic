using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class CreateDoctorDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public Guid SpecialtyId { get; set; }
        public string LicenseNumber { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int ExperienceYears { get; set; }
        public decimal ConsultationFee { get; set; }
    }
}
