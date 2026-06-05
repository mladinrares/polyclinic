using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class ReceptionFilterDto
    {
        public DateOnly Date { get; set; }
        public Guid? LocationId { get; set; }
        public Guid? DoctorId { get; set; }
        public Guid? SpecialtyId { get; set; }
        public string? SearchName { get; set; }
        public TimeOnly? FromTime { get; set; }
        public TimeOnly? ToTime { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? Status { get; set; } 
    }
}
