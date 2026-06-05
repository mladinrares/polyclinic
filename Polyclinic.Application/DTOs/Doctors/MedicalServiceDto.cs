using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Doctors
{
    public class MedicalServiceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public decimal Price { get; set; }
        public bool RequiresReferral { get; set; }
        public bool IsBookableOnline { get; set; }
        public Guid SpecialtyId { get; set; }
        public string SpecialtyName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsCNASCovered { get; set; }
        public decimal? CNASCoveredAmount { get; set; }
    }
}
