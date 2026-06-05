using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class ReceptionCreateAppointmentDto
    {
        public string? PatientEmail { get; set; } = string.Empty;
        public string? WalkInCNP { get; set; } = string.Empty;
        public Guid DoctorId { get; set; }
        public Guid ServiceId { get; set; }
        public Guid LocationId { get; set; }
        public Guid TimeSlotId { get; set; }
        public string? Reason { get; set; }
    }
}
