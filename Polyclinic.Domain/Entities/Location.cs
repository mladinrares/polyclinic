using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    

    public class Location : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool IsActive { get; set; } = true;

        // Relatii
        public ICollection<DoctorLocation> DoctorLocations { get; set; } = new List<DoctorLocation>();
        public ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<WaitingList> WaitingList { get; set; } = new List<WaitingList>();
    }
}
