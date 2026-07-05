using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Audit;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System.Text.Json;

namespace Polyclinic.Infrastructure.Services
{


    public class AuditService : IAuditService
    {

        private readonly PolyclinicDbContext _context;
        public AuditService(PolyclinicDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            Guid? userId,
            string action,
            string entityType,
            Guid? entityId = null,
            object? oldValues = null,
            object? newValues = null,
            string? ipAddress = null)
        {
            var log = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId ?? Guid.Empty,
                OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
                NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<PagedResultDto<AuditLogDto>> GetLogsAsync(AuditFilterDto filter)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filter.UserEmail))
                query = query.Where(a => a.User != null && a.User.Email.Contains(filter.UserEmail));

            if (!string.IsNullOrEmpty(filter.Action))
                query = query.Where(a => a.Action == filter.Action);

            if (!string.IsNullOrEmpty(filter.EntityType))
                query = query.Where(a => a.EntityType == filter.EntityType);

            if (filter.DateFrom.HasValue)
                query = query.Where(a => a.CreatedAt >= filter.DateFrom.Value);

            if (filter.DateTo.HasValue)
                query = query.Where(a => a.CreatedAt <= filter.DateTo.Value);

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserEmail = a.User != null ? a.User.Email : "System",
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues,
                    IpAddress = a.IpAddress,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return new PagedResultDto<AuditLogDto>
            {
                Items = logs,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }
    }
}
