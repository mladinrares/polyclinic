using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Admin;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System.Text.Json;

namespace Polyclinic.Infrastructure.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly PolyclinicDbContext _context;

        public AnalyticsService(PolyclinicDbContext context)
        {
            _context = context;
        }

        public async Task TrackAsync(Guid? userId, string eventName, string? page = null, object? data = null)
        {
            var analyticsEvent = new AnalyticsEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Event = eventName,
                Page = page,
                Data = data != null ? JsonSerializer.Serialize(data) : null,
                CreatedAt = DateTime.UtcNow,
            };
            _context.AnalyticsEvents.Add(analyticsEvent);
            await _context.SaveChangesAsync();
        }

        public async Task<AnalyticsSummaryDto> GetSummaryAsync()
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var events = await _context.AnalyticsEvents
                .Where(e => e.CreatedAt >= thirtyDaysAgo)
                .ToListAsync();

            var topSearches = events
                .Where(e => e.Event == "search" && e.Data != null)
                .Select(e => {
                    try
                    {
                        var d = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(e.Data!);
                        return d?.GetValueOrDefault("query").GetString() ?? "";
                    }
                    catch { return ""; }
                })
                .Where(q => !string.IsNullOrEmpty(q))
                .GroupBy(q => q)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new EventCountDto { Name = g.Key, Count = g.Count() })
                .ToList();

            var topSpecialties = events
                .Where(e => e.Event == "filter_specialty" && e.Data != null)
                .Select(e => {
                    try
                    {
                        var d = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(e.Data!);
                        return d?.GetValueOrDefault("specialtyName").GetString() ?? "";
                    }
                    catch { return ""; }
                })
                .Where(s => !string.IsNullOrEmpty(s))
                .GroupBy(s => s)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new EventCountDto { Name = g.Key, Count = g.Count() })
                .ToList();

            var dailyEvents = events
                .GroupBy(e => e.CreatedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => new DailyEventDto
                {
                    Date = g.Key.ToString("dd MMM"),
                    Count = g.Count(),
                })
                .ToList();

            return new AnalyticsSummaryDto
            {
                TotalEvents = events.Count,
                UniqueUsers = events.Where(e => e.UserId.HasValue).Select(e => e.UserId).Distinct().Count(),
                TopEvents = events
                    .GroupBy(e => e.Event)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => new EventCountDto { Name = g.Key, Count = g.Count() })
                    .ToList(),
                TopPages = events
                    .Where(e => e.Page != null)
                    .GroupBy(e => e.Page!)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => new EventCountDto { Name = g.Key, Count = g.Count() })
                    .ToList(),
                TopSearches = topSearches,
                TopSpecialties = topSpecialties,
                DailyEvents = dailyEvents,
            };
        }
    }
}
