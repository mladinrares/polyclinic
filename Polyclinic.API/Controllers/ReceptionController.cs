using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Appointments;
using Polyclinic.Application.DTOs.Users;
using Polyclinic.Application.Interfaces;
using Polyclinic.Infrastructure.Services;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "receptionist,admin")]
    public class ReceptionController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;
        private readonly IUserService _userService;

        public ReceptionController(IAppointmentService appointmentService,
            IUserService userService)
        {
            _appointmentService = appointmentService;
            _userService = userService;
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> GetTodayAppointments(
        [FromQuery] DateOnly? date = null,
        [FromQuery] Guid? locationId = null,
        [FromQuery] string? searchName = null,
        [FromQuery] TimeOnly? fromTime = null,
        [FromQuery] TimeOnly? toTime = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] Guid? doctorId = null,
        [FromQuery] Guid? specialtyId = null,
        [FromQuery] int pageSize = 20)
        {
            var filter = new ReceptionFilterDto
            {
                Date = date ?? DateOnly.FromDateTime(DateTime.UtcNow),
                LocationId = locationId,
                SearchName = searchName,
                FromTime = fromTime,
                ToTime = toTime,
                Page = page,
                PageSize = pageSize,
                DoctorId = doctorId,
                SpecialtyId = specialtyId,
                Status = status
            };

            var result = await _appointmentService.GetTodayAppointmentsAsync(filter);
            return Ok(result);
        }

        [HttpGet("pending-referrals")]
        public async Task<IActionResult> GetPendingReferrals(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        {
            var result = await _appointmentService.GetPendingReferralsAsync(page, pageSize);
            return Ok(result);
        }

        [HttpPost("appointments/{id}/checkin")]
        public async Task<IActionResult> CheckIn(Guid id)
        {
            await _appointmentService.CheckInPatientAsync(id);
            return Ok();
        }

        [HttpPost("appointments/{id}/payment")]
        public async Task<IActionResult> ProcessPayment(Guid id, [FromBody] string paymentMethod)
        {
            await _appointmentService.ProcessPaymentAsync(id, paymentMethod);
            return Ok();
        }
        [HttpPost("appointments")]
        public async Task<IActionResult> CreateAppointmentForPatient([FromBody] ReceptionCreateAppointmentDto dto)
        {
            var result = await _appointmentService.CreateAppointmentForPatientAsync(dto);
            return Ok(result);
        }

        [HttpGet("available-filters")]
        public async Task<IActionResult> GetAvailableFilters([FromQuery] DateOnly? date = null)
        {
            var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

            var doctorIds = await _appointmentService.GetDoctorIdsForDateAsync(targetDate);
            var specialtyIds = await _appointmentService.GetSpecialtyIdsForDateAsync(targetDate);

            return Ok(new { doctorIds, specialtyIds });
        }
        [HttpGet("patient-by-email")]
        public async Task<IActionResult> GetPatientByEmail([FromQuery] string email)
        {
            var result = await _userService.GetPatientByEmailAsync(email);
            if (result == null) return NotFound();
            return Ok(result);
        }

        

        [HttpPost("patients")]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
        {
            var result = await _userService.CreatePatientAsync(dto);
            return Ok(result);
        }

        [HttpGet("patients")]
        public async Task<IActionResult> GetPatients([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool showInactive = false)
        {
            var result = await _userService.GetAllPatientsAsync(search, page, pageSize, showInactive);
            return Ok(result);
        }

        [HttpPost("patients/{id}/reactivate")]
        public async Task<IActionResult> ReactivatePatient(Guid id)
        {
            await _userService.ReactivatePatientAsync(id);
            return Ok();
        }

        [HttpPut("patients/{id}")]
        public async Task<IActionResult> UpdatePatient(Guid id, [FromBody] UpdatePatientDto dto)
        {
            await _userService.UpdatePatientAsync(id, dto);
            return Ok();
        }
        [HttpPost("patients/{id}/deactivate")]
        public async Task<IActionResult> DeactivatePatient(Guid id)
        {
            await _userService.DeactivatePatientAsync(id);
            return Ok();
        }

        [HttpPost("patients/{id}/resend-verification")]
        public async Task<IActionResult> ResendVerification(Guid id)
        {
            await _userService.ResendVerificationEmailAsync(id);
            return Ok();
        }
    }
}
