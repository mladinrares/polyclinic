using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Doctors
{
    public class DoctorCalendarDayDto
    {
        public DateOnly Date { get; set; }
        public int TotalSlots { get; set; }
        public int AvailableSlots { get; set; }
        public bool HasAvailable => AvailableSlots > 0;
    }
}
