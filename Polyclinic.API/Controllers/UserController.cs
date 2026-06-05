using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.API.Services;
using Polyclinic.Application.DTOs.InsuranceCard;
using Polyclinic.Application.DTOs.Users;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Services;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _userService.GetProfileAsync(userId);
            return Ok(result);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _userService.UpdateProfileAsync(userId, dto);
            return Ok(result);
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _userService.ChangePasswordAsync(userId, dto);
            return Ok();
        }

        [HttpGet("insurance-cards")]
        public async Task<IActionResult> GetInsuranceCards()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _userService.GetInsuranceCardsAsync(userId);
            return Ok(result);
        }

        [HttpPost("insurance-cards")]
        public async Task<IActionResult> AddInsuranceCard([FromBody] AddInsuranceCardDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _userService.AddInsuranceCardAsync(userId, dto);
            return Ok(result);
        }

        [HttpDelete("insurance-cards/{id}")]
        public async Task<IActionResult> RemoveInsuranceCard(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _userService.RemoveInsuranceCardAsync(id, userId);
            return Ok();
        }

        [HttpGet("insurance-cards/valid")]
        public async Task<IActionResult> GetValidInsuranceCard()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _userService.GetValidInsuranceCardAsync(userId);
            return Ok(result);
        }
        [HttpGet("insurance-cards/all")]
        [Authorize(Roles = "receptionist,admin")]
        public async Task<IActionResult> GetPatientsWithCards(
        [FromQuery] string? searchName = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        {
            var result = await _userService.GetPatientsWithCardsAsync(searchName, page, pageSize);
            return Ok(result);
        }

        [HttpPost("insurance-cards/{id}/validate")]
        [Authorize(Roles = "receptionist,admin")]
        public async Task<IActionResult> ValidateInsuranceCard(Guid id)
        {
            await _userService.ValidateInsuranceCardAsync(id);
            return Ok();
        }

        [HttpPost("insurance-cards/{id}/invalidate")]
        [Authorize(Roles = "receptionist,admin")]
        public async Task<IActionResult> InvalidateInsuranceCard(Guid id)
        {
            await _userService.InvalidateInsuranceCardAsync(id);
            return Ok();
        }

        [HttpPost("profile-picture")]
        [Authorize]
        public async Task<IActionResult> UploadProfilePicture([FromForm] IFormFile file)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var fileStorage = HttpContext.RequestServices.GetRequiredService<FileStorageService>();
            var fileUrl = await fileStorage.SaveFileAsync(file, $"profiles/{userId}");

            await _userService.UpdateProfilePictureAsync(userId, fileUrl);

            return Ok(new { profilePictureUrl = fileUrl });
        }

        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteOwnAccount()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
            if (userIdStr == null) return Unauthorized();
            await _userService.DeleteOwnAccountAsync(Guid.Parse(userIdStr));
            return Ok();
        }
    }
}
