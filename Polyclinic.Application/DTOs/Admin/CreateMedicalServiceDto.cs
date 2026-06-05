using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class CreateMedicalServiceDto
    {
        public Guid SpecialtyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DurationMinutes { get; set; }
        public decimal Price { get; set; }
        public bool RequiresReferral { get; set; } = false;
        public bool IsBookableOnline { get; set; } = true;
        public bool IsCNASCovered { get; set; } = false;
        public decimal? CNASCoveredAmount { get; set; }
    }
}
