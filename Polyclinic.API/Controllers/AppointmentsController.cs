using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Polyclinic.API.Services;
using Polyclinic.Application.DTOs.Appointments;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet("slots")]
        public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] Guid doctorId,
        [FromQuery] Guid locationId,
        [FromQuery] DateOnly date,
        [FromQuery] Guid? serviceId = null)
        {
            var slots = await _appointmentService.GetAvailableSlotsAsync(doctorId, locationId, date, serviceId);
            return Ok(slots);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            var patientId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _appointmentService.CreateAppointmentAsync(patientId, dto);
            return Ok(result);
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyAppointments(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var patientId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _appointmentService.GetPatientAppointmentsAsync(patientId, page, pageSize);
            return Ok(result);
        }

        [HttpPost("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelAppointment(Guid id, [FromBody] string reason)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _appointmentService.CancelAppointmentAsync(id, userId, reason);
            return Ok();
        }

        [HttpGet("doctor")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetDoctorAppointments([FromQuery] DateOnly? date = null)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var doctor = await HttpContext.RequestServices
                .GetRequiredService<Polyclinic.Infrastructure.Persistence.PolyclinicDbContext>()
                .Doctors.FirstOrDefaultAsync(d => d.UserId == userId);

            if (doctor == null) return NotFound("Doctorul nu a fost găsit");

            var result = await _appointmentService.GetDoctorAppointmentsAsync(doctor.Id, date);
            return Ok(result);
        }

        [HttpPost("{id}/complete")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CompleteAppointment(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var doctor = await HttpContext.RequestServices
                .GetRequiredService<Polyclinic.Infrastructure.Persistence.PolyclinicDbContext>()
                .Doctors.FirstOrDefaultAsync(d => d.UserId == userId);

            if (doctor == null) return NotFound("Doctorul nu a fost găsit");

            await _appointmentService.CompleteAppointmentAsync(id, doctor.Id);
            return Ok();
        }

        [HttpPost("investigations/{investigationId}/upload")]
        public async Task<IActionResult> UploadInvestigationResult(
                                                                    Guid investigationId,
                                                                    [FromForm] IFormFile file)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var fileStorage = HttpContext.RequestServices.GetRequiredService<FileStorageService>();
            var fileUrl = await fileStorage.SaveFileAsync(file, $"investigations/{userId}");

            await _appointmentService.UploadInvestigationResultAsync(investigationId, userId, fileUrl);
            return Ok(new { fileUrl });
        }

        [HttpPost("investigations/{investigationId}/complete")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CompleteInvestigation(Guid investigationId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _appointmentService.CompleteInvestigationAsync(investigationId, userId);
            return Ok();
        }


        [HttpGet("first-available")]
        public async Task<IActionResult> GetFirstAvailableDate(
        [FromQuery] Guid doctorId,
        [FromQuery] Guid locationId,
        [FromQuery] Guid? serviceId = null,
        [FromQuery] DateOnly? afterDate = null)
        {
            var result = await _appointmentService.GetFirstAvailableDateAsync(doctorId, locationId, serviceId, afterDate);
            var hasAnySlots = await _appointmentService.DoctorHasAnySlotsAsync(doctorId, locationId, serviceId);

            if (result == null)
                return Ok(new { date = (string?)null, hasAnySlots });

            return Ok(new { date = result.Value.ToString("yyyy-MM-dd"), hasAnySlots = true });
        }
        [HttpGet("available-locations")]
        public async Task<IActionResult> GetAvailableLocations(
        [FromQuery] Guid doctorId,
        [FromQuery] Guid serviceId)
        {
            var result = await _appointmentService.GetAvailableLocationIdsAsync(doctorId, serviceId);
            return Ok(result);
        }
        [HttpPost("{id}/upload-referral")]
        [Authorize]
        public async Task<IActionResult> UploadExternalReferral(Guid id, [FromForm] IFormFile file)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var fileStorage = HttpContext.RequestServices.GetRequiredService<FileStorageService>();
            var fileUrl = await fileStorage.SaveFileAsync(file, $"referrals/{userId}");

            await _appointmentService.UploadExternalReferralAsync(id, userId, fileUrl);
            return Ok(new { fileUrl });
        }

        [HttpPost("{id}/approve-referral")]
        [Authorize(Roles = "receptionist,admin")]
        public async Task<IActionResult> ApproveExternalReferral(Guid id)
        {
            await _appointmentService.ApproveExternalReferralAsync(id);
            return Ok();
        }

        [HttpPost("{id}/reject-referral")]
        [Authorize(Roles = "receptionist,admin")]
        public async Task<IActionResult> RejectExternalReferral(Guid id, [FromBody] string reason)
        {
            await _appointmentService.RejectExternalReferralAsync(id, reason);
            return Ok();
        }

        [HttpPost("waiting-list")]
        [Authorize]
        public async Task<IActionResult> AddToWaitingList([FromBody] AddToWaitingListDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _appointmentService.AddToWaitingListAsync(userId, dto);
            return Ok(result);
        }

        [HttpGet("waiting-list")]
        [Authorize]
        public async Task<IActionResult> GetMyWaitingList()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _appointmentService.GetPatientWaitingListAsync(userId);
            return Ok(result);
        }

        [HttpDelete("waiting-list/{id}")]
        [Authorize]
        public async Task<IActionResult> RemoveFromWaitingList(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            await _appointmentService.RemoveFromWaitingListAsync(id, userId);
            return Ok();
        }

        [HttpGet("calendar/{doctorId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDoctorCalendar(
        Guid doctorId,
        [FromQuery] Guid locationId,
        [FromQuery] Guid? serviceId)
        {
            var result = await _appointmentService.GetDoctorCalendarAsync(doctorId, locationId, serviceId);
            return Ok(result);
        }

        [HttpGet("locations-by-service/{doctorId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLocationsByService(Guid doctorId, [FromQuery] Guid serviceId)
        {
            var result = await _appointmentService.GetDoctorLocationsByServiceAsync(doctorId, serviceId);
            return Ok(result);
        }
    }
}
