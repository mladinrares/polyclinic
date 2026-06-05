using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Doctor : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid SpecialtyId { get; set; }
        public string LicenseNumber { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int ExperienceYears { get; set; }
        public decimal ConsultationFee { get; set; }
        public bool IsAvailable { get; set; } = true;

        // Relatii
        public User User { get; set; } = null!;
        public Specialty Specialty { get; set; } = null!;
        public ICollection<DoctorLocation> DoctorLocations { get; set; } = new List<DoctorLocation>();
        public ICollection<DoctorService> DoctorServices { get; set; } = new List<DoctorService>();
        public ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
