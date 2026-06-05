using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.InsuranceCard
{
    public class InsuranceCardDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string InsuredCode { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public DateOnly ExpiryDate { get; set; }
        public bool IsActive { get; set; }
        public bool IsValid { get; set; }
        public bool IsVerified { get; set; }
    }
}
