using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.DTOs.WalkIn;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IWalkInPatientService
    {
        Task<WalkInPatientDto> CreateAsync(CreateWalkInPatientDto dto);
        Task<WalkInPatientDto?> GetByCNPAsync(string cnp);
        Task<WalkInPatientDto> UpdateAsync(Guid id, CreateWalkInPatientDto dto);
        Task<PagedResultDto<WalkInPatientDto>> GetAllAsync(string? search, int page, int pageSize, bool showInactive = false);
        Task<MigrateWalkInResultDto> MigrateToAccountAsync(Guid walkInPatientId);
        Task DeactivateAsync(Guid id);
        Task ReactivateAsync(Guid id);
    }
}
