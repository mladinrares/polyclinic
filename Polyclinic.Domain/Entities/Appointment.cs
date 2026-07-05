using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    

    public class Appointment : BaseEntity
    {
        public Guid? PatientId { get; set; }
        public Guid? WalkInPatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid ServiceId { get; set; }
        public Guid LocationId { get; set; }
        public Guid TimeSlotId { get; set; }
        public string Status { get; set; } = "pending";
        public string Type { get; set; } = "in_person";
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public decimal PricePaid { get; set; }
        public string PaymentStatus { get; set; } = "unpaid";
        public string? PaymentMethod { get; set; }
        public string? CancellationReason { get; set; }
        public Guid? CancelledBy { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public string? ExternalReferralUrl { get; set; }
        public string? CancelledByRole { get; set; } // "patient", "doctor", "receptionist", "admin"


        // Relatii
        public User Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public MedicalService Service { get; set; } = null!;
        public Location Location { get; set; } = null!;
        public TimeSlot TimeSlot { get; set; } = null!;


        // Relatii inverse
        public WalkInPatient? WalkInPatient { get; set; }
        public Review? Review { get; set; }
        public MedicalRecord? MedicalRecord { get; set; }
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
    }
}
