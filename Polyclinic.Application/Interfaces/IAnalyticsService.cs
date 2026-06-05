using Polyclinic.Application.DTOs.Admin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IAnalyticsService
    {
        Task TrackAsync(Guid? userId, string eventName, string? page = null, object? data = null);
        Task<AnalyticsSummaryDto> GetSummaryAsync();
    }
}
