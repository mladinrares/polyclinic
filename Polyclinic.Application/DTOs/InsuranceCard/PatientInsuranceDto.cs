using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.InsuranceCard
{
    public class PatientInsuranceDto
    {
        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string PatientEmail { get; set; } = string.Empty;
        public Guid CardId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string InsuredCode { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public DateOnly ExpiryDate { get; set; }
        public bool IsVerified { get; set; }
        public bool IsValid { get; set; }
    }
}
