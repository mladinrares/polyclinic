using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpPost("track")]
        [AllowAnonymous]
        public async Task<IActionResult> Track([FromBody] TrackEventDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
            Guid? userId = userIdStr != null ? Guid.Parse(userIdStr) : null;

            await _analyticsService.TrackAsync(userId, dto.Event, dto.Page, dto.Data);
            return Ok();
        }

        [HttpGet("summary")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetSummary()
        {
            var result = await _analyticsService.GetSummaryAsync();
            return Ok(result);
        }
    }

    public class TrackEventDto
    {
        public string Event { get; set; } = string.Empty;
        public string? Page { get; set; }
        public Dictionary<string, string>? Data { get; set; }
    }
}
