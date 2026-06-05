using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class UpdateDoctorDto
    {
        
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public Guid SpecialtyId { get; set; }
        public string? Bio { get; set; }
        public int ExperienceYears { get; set; }
        public decimal ConsultationFee { get; set; }
        public string LicenseNumber { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        
    }
}
