using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class DoctorScheduleDto
    {
        public Guid Id { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public string? ServiceName { get; set; }
        public string WorkingDays { get; set; } = string.Empty;
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsActive { get; set; }
    }
}
