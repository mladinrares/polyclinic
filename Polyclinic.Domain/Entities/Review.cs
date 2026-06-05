using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class Review : BaseEntity
    {
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid AppointmentId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsVisible { get; set; } = true;

        // Relatii
        public User Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public Appointment Appointment { get; set; } = null!;
    }
}
