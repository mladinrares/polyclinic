using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class AppointmentDto
    {
        public Guid Id { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string SpecialtyName { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public DateTime SlotDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal PricePaid { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public decimal OriginalPrice { get; set; }
        public bool IsCNASApplied { get; set; }
        public bool HasReview { get; set; } 
    }
}
