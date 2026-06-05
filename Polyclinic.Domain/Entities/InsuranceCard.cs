using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Domain.Entities
{
    public class InsuranceCard : BaseEntity
    {
        public Guid? PatientId { get; set; }
        public Guid? WalkInPatientId { get; set; }  
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string InsuredCode { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public DateOnly ExpiryDate { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }

        // Relatii
        public User Patient { get; set; } = null!;
        public WalkInPatient WalkInPatient { get; set; }
    }
}
