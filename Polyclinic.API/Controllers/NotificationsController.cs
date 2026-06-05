using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.Interfaces;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(result);
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok();
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok();
        }
    }
}
