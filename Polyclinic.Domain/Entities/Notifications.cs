using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{

    public class Notification : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid? AppointmentId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public DateTime? SentAt { get; set; }
        public string Status { get; set; } = "pending";

        // Relatii
        public User User { get; set; } = null!;
        public Appointment? Appointment { get; set; }
    }
}
