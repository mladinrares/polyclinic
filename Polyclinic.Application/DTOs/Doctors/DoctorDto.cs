using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Doctors
{
    public class DoctorDto
    {
        public Guid Id { get; set; }
        public Guid SpecialtyId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string SpecialtyName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int ExperienceYears { get; set; }
        public decimal ConsultationFee { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsAvailable { get; set; }
        public string? LicenseNumber { get; set; }  
        public List<Guid> LocationIds { get; set; } = new();
    }
}
