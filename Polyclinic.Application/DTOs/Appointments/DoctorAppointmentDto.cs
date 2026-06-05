using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class DoctorAppointmentDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string SpecialtyName { get; set; } = string.Empty;
        public DateOnly SlotDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public decimal PricePaid { get; set; }
        public bool HasMedicalRecord { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string? ExternalReferralUrl { get; set; }
        public bool IsWalkIn { get; set; }
    }
}
