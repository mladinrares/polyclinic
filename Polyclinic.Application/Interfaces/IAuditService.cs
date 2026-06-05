using Polyclinic.Application.DTOs.Audit;
using Polyclinic.Application.DTOs.Doctors;

namespace Polyclinic.Application.Interfaces
{

    public interface IAuditService
    {
        Task LogAsync(
            Guid? userId,
            string action,
            string entityType,
            Guid? entityId = null,
            object? oldValues = null,
            object? newValues = null,
            string? ipAddress = null
        );
        Task<PagedResultDto<AuditLogDto>> GetLogsAsync(AuditFilterDto filter);
    }
}
