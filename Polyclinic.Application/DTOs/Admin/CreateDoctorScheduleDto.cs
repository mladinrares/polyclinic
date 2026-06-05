using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class CreateDoctorScheduleDto
    {
        public Guid DoctorId { get; set; }
        public Guid LocationId { get; set; }
        public Guid? ServiceId { get; set; }
        public List<string> WorkingDays { get; set; } = new();
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }
}
