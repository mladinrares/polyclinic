using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.DTOs.InsuranceCard;
using Polyclinic.Application.DTOs.Patients;
using Polyclinic.Application.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileDto> GetProfileAsync(Guid userId);
        Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
        Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);

        Task<List<InsuranceCardDto>> GetInsuranceCardsAsync(Guid userId);
        Task<InsuranceCardDto> AddInsuranceCardAsync(Guid userId, AddInsuranceCardDto dto);
        Task RemoveInsuranceCardAsync(Guid cardId, Guid userId);
        Task<InsuranceCardDto?> GetValidInsuranceCardAsync(Guid userId);

        Task<PagedResultDto<PatientInsuranceDto>> GetPatientsWithCardsAsync(string? searchName, int page, int pageSize);
        Task ValidateInsuranceCardAsync(Guid cardId);

        Task InvalidateInsuranceCardAsync(Guid cardId);
        Task UpdateProfilePictureAsync(Guid userId, string profilePictureUrl);
        Task<PatientLookupDto?> GetPatientByEmailAsync(string email);
        Task<PagedResultDto<PatientDto>> GetAllPatientsAsync(string? search, int page, int pageSize, bool showInactive = false);
        Task UpdatePatientAsync(Guid id, UpdatePatientDto dto);
        Task DeactivatePatientAsync(Guid id);
        Task<PatientDto> CreatePatientAsync(CreatePatientDto dto);
        Task ReactivatePatientAsync(Guid id);
        Task DeleteOwnAccountAsync(Guid userId);
        Task ResendVerificationEmailAsync(Guid userId);
    }
}
