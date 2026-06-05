using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class WaitingList : BaseEntity
    {
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid ServiceId { get; set; }
        public Guid LocationId { get; set; }
        public DateOnly PreferredDateFrom { get; set; }
        public DateOnly PreferredDateTo { get; set; }
        public string? PreferredTimeOfDay { get; set; }
        public string Status { get; set; } = "waiting";
        public DateTime? NotifiedAt { get; set; }
        public DateOnly? NotifiedSlotDate { get; set; }
        public TimeOnly? NotifiedSlotTime { get; set; }

        // Relatii
        public User Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public MedicalService Service { get; set; } = null!;
        public Location Location { get; set; } = null!;
    }
}
