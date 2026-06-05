using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Appointments
{
    public class WaitingListEntryDto
    {
        public Guid Id { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public DateOnly PreferredDateFrom { get; set; }
        public DateOnly PreferredDateTo { get; set; }
        public string? PreferredTimeOfDay { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? NotifiedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
