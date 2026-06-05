using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class SlotTimeDto
    {
        public Guid Id { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public bool HasAppointment { get; set; }
        public string? PatientName { get; set; }
        public string? LocationName { get; set; }
    }
}
