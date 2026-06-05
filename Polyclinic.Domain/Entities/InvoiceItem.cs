using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class InvoiceItem : BaseEntity
    {
        public Guid AppointmentId { get; set; }
        public Guid? ServiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal TotalPrice { get; set; }
        public string AddedBy { get; set; } = string.Empty;
        public Guid AddedByUserId { get; set; }

        // Relatii
        public Appointment Appointment { get; set; } = null!;
        public MedicalService? Service { get; set; }
        public User AddedByUser { get; set; } = null!;
    }
}
