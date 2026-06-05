using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class DoctorService : BaseEntity
    {
        public Guid DoctorId { get; set; }
        public Guid ServiceId { get; set; }

        // Relatii
        public Doctor Doctor { get; set; } = null!;
        public MedicalService Service { get; set; } = null!;
    }
}
