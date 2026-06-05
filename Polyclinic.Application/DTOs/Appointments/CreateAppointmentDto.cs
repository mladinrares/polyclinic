using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class CreateAppointmentDto
    {
        public Guid DoctorId { get; set; }
        public Guid ServiceId { get; set; }
        public Guid LocationId { get; set; }
        public Guid TimeSlotId { get; set; }
        public string? ExternalReferralUrl { get; set; }
        public string? Reason { get; set; }
        public string Type { get; set; } = "in_person";
    }
}
