using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class AddToWaitingListDto
    {
        public Guid DoctorId { get; set; }
        public Guid ServiceId { get; set; }
        public Guid LocationId { get; set; }
        public DateOnly PreferredDateFrom { get; set; }
        public DateOnly PreferredDateTo { get; set; }
        public string? PreferredTimeOfDay { get; set; }
    }
}
