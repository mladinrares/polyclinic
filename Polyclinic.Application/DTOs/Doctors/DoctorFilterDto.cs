using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Doctors
{
    public class DoctorFilterDto
    {
        public string? SearchName { get; set; }
        public Guid? SpecialtyId { get; set; }
        public Guid? LocationId { get; set; }
        public decimal? MaxFee { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 12;
    }
}
