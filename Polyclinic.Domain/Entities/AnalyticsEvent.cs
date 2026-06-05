using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class AnalyticsEvent
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string Event { get; set; } = string.Empty;
        public string? Data { get; set; } // JSON
        public string? Page { get; set; }
        public DateTime CreatedAt { get; set; }

        public User? User { get; set; }
    }
}
