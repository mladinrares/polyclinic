using Polyclinic.Application.DTOs.Referrals;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IReferralService
    {
        Task<ReferralDto> CreateReferralAsync(Guid doctorUserId, CreateReferralDto dto);
        Task<List<ReferralDto>> GetPatientReferralsAsync(Guid patientId);
        Task<List<ReferralDto>> GetDoctorIssuedReferralsAsync(Guid doctorUserId);
        Task<ReferralDto?> GetValidReferralAsync(Guid patientId, Guid serviceId);
        Task UseReferralAsync(Guid referralId);
    }
}
