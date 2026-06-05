using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class MedicalService : BaseEntity
    {
        public Guid SpecialtyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DurationMinutes { get; set; }
        public decimal Price { get; set; }
        public bool IsCNASCovered { get; set; } = false;
        public decimal? CNASCoveredAmount { get; set; }
        public bool RequiresReferral { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public bool IsBookableOnline { get; set; } = true;

        // Relatii
        public Specialty Specialty { get; set; } = null!;
        public ICollection<DoctorService> DoctorServices { get; set; } = new List<DoctorService>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<WaitingList> WaitingList { get; set; } = new List<WaitingList>();
    }
}
