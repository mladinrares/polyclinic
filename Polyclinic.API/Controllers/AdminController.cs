using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.DTOs.Admin;
using Polyclinic.Application.DTOs.Audit;
using Polyclinic.Application.Interfaces;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IAuditService _auditService;

        public AdminController(IAdminService adminService, IAuditService auditService)
        {
            _adminService = adminService;
            _auditService = auditService;
        }
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? userEmail = null,
        [FromQuery] string? action = null,
        [FromQuery] string? entityType = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
        {
            var filter = new AuditFilterDto
            {
                UserEmail = userEmail,
                Action = action,
                EntityType = entityType,
                DateFrom = dateFrom,
                DateTo = dateTo,
                Page = page,
                PageSize = pageSize
            };

            var result = await _auditService.GetLogsAsync(filter);
            return Ok(result);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var result = await _adminService.GetStatsAsync();
            return Ok(result);
        }

        // Doctori
        [HttpPost("doctors")]
        public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
        {
            var result = await _adminService.CreateDoctorAsync(dto);
            return Ok(result);
        }

        [HttpPut("doctors/{id}")]
        public async Task<IActionResult> UpdateDoctor(Guid id, [FromBody] UpdateDoctorDto dto)
        {
            var result = await _adminService.UpdateDoctorAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("doctors/{id}")]
        public async Task<IActionResult> DeleteDoctor(Guid id)
        {
            await _adminService.DeleteDoctorAsync(id);
            return Ok();
        }

        // Specialitati
        [HttpGet("specialties")]
        public async Task<IActionResult> GetSpecialties([FromQuery] bool includeInactive = false)
        {
            var result = await _adminService.GetSpecialtiesAsync(includeInactive);
            return Ok(result);
        }

        [HttpPost("specialties")]
        public async Task<IActionResult> CreateSpecialty([FromBody] CreateSpecialtyDto dto)
        {
            var result = await _adminService.CreateSpecialtyAsync(dto);
            return Ok(result);
        }

        [HttpDelete("specialties/{id}")]
        public async Task<IActionResult> DeleteSpecialty(Guid id)
        {
            await _adminService.DeleteSpecialtyAsync(id);
            return Ok();
        }

        // Locatii
        [HttpGet("locations")]
        public async Task<IActionResult> GetLocations([FromQuery] bool includeInactive = false)
        {
            var result = await _adminService.GetLocationsAsync(includeInactive);
            return Ok(result);
        }

        [HttpPost("locations")]
        public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDto dto)
        {
            var result = await _adminService.CreateLocationAsync(dto);
            return Ok(result);
        }

        [HttpDelete("locations/{id}")]
        public async Task<IActionResult> DeleteLocation(Guid id)
        {
            await _adminService.DeleteLocationAsync(id);
            return Ok();
        }
        [HttpGet("services")]
        public async Task<IActionResult> GetServices([FromQuery] bool includeInactive = false)
        {
            var result = await _adminService.GetServicesAsync(includeInactive);
            return Ok(result);
        }

        [HttpPost("services")]
        public async Task<IActionResult> CreateService([FromBody] CreateMedicalServiceDto dto)
        {
            var result = await _adminService.CreateServiceAsync(dto);
            return Ok(result);
        }

        [HttpDelete("services/{id}")]
        public async Task<IActionResult> DeleteService(Guid id)
        {
            await _adminService.DeleteServiceAsync(id);
            return Ok();
        }
        [HttpPost("doctors/{doctorId}/services/{serviceId}")]
        public async Task<IActionResult> AddServiceToDoctor(Guid doctorId, Guid serviceId)
        {
            await _adminService.AddServiceToDoctorAsync(doctorId, serviceId);
            return Ok();
        }

        [HttpDelete("doctors/{doctorId}/services/{serviceId}")]
        public async Task<IActionResult> RemoveServiceFromDoctor(Guid doctorId, Guid serviceId)
        {
            await _adminService.RemoveServiceFromDoctorAsync(doctorId, serviceId);
            return Ok();
        }

        [HttpGet("doctors/{doctorId}/schedules")]
        public async Task<IActionResult> GetDoctorSchedules(Guid doctorId)
        {
            var result = await _adminService.GetDoctorSchedulesAsync(doctorId);
            return Ok(result);
        }

        [HttpPost("doctors/schedules")]
        public async Task<IActionResult> CreateDoctorSchedule([FromBody] CreateDoctorScheduleDto dto)
        {
            var result = await _adminService.CreateDoctorScheduleAsync(dto);
            return Ok(result);
        }

        [HttpDelete("doctors/schedules/{id}")]
        public async Task<IActionResult> DeleteDoctorSchedule(Guid id)
        {
            await _adminService.DeleteDoctorScheduleAsync(id);
            return Ok();
        }

        [HttpPost("doctors/{doctorId}/generate-slots")]
        public async Task<IActionResult> GenerateSlots(Guid doctorId, [FromQuery] int daysAhead = 30)
        {
            await _adminService.GenerateSlotsFromScheduleAsync(doctorId, daysAhead);
            return Ok();
        }

        [HttpGet("doctors")]
        public async Task<IActionResult> GetDoctors([FromQuery] bool includeInactive = false)
        {
            var result = await _adminService.GetAllDoctorsAsync(includeInactive);
            return Ok(result);
        }

        [HttpPost("doctors/{id}/reactivate")]
        public async Task<IActionResult> ReactivateDoctor(Guid id)
        {
            await _adminService.ReactivateDoctorAsync(id);
            return Ok();
        }

        [HttpPost("specialties/{id}/reactivate")]
        public async Task<IActionResult> ReactivateSpecialty(Guid id)
        {
            await _adminService.ReactivateSpecialtyAsync(id);
            return Ok();
        }

        [HttpPost("locations/{id}/reactivate")]
        public async Task<IActionResult> ReactivateLocation(Guid id)
        {
            await _adminService.ReactivateLocationAsync(id);
            return Ok();
        }

        [HttpPost("services/{id}/reactivate")]
        public async Task<IActionResult> ReactivateService(Guid id)
        {
            await _adminService.ReactivateServiceAsync(id);
            return Ok();
        }
        [HttpPut("services/{id}")]
        public async Task<IActionResult> UpdateService(Guid id, [FromBody] CreateMedicalServiceDto dto)
        {
            var result = await _adminService.UpdateServiceAsync(id, dto);
            return Ok(result);
        }

        [HttpPut("specialties/{id}")]
        public async Task<IActionResult> UpdateSpecialty(Guid id, [FromBody] CreateSpecialtyDto dto)
        {
            var result = await _adminService.UpdateSpecialtyAsync(id, dto);
            return Ok(result);
        }
        [HttpPut("locations/{id}")]
        public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] CreateLocationDto dto)
        {
            var result = await _adminService.UpdateLocationAsync(id, dto);
            return Ok(result);
        }

        [HttpGet("stats/monthly")]
        public async Task<IActionResult> GetMonthlyStats()
        {
            var result = await _adminService.GetMonthlyStatsAsync();
            return Ok(result);
        }

        [HttpDelete("doctors/{id}/slots/date")]
        public async Task<IActionResult> DeleteSlotsByDate(Guid id, [FromQuery] DateOnly date, [FromQuery] string reason)
        {
            await _adminService.DeleteSlotsByDateAsync(id, date, reason);
            return Ok();
        }

        [HttpDelete("doctors/{id}/slots/time")]
        public async Task<IActionResult> DeleteSlotsByTime(Guid id, [FromQuery] DateOnly date, [FromQuery] TimeOnly time, [FromQuery] string reason)
        {
            await _adminService.DeleteSlotsByTimeAsync(id, date, time, reason);
            return Ok();
        }

        [HttpGet("doctors/{id}/slots/calendar")]
        public async Task<IActionResult> GetSlotsCalendar(Guid id)
        {
            var result = await _adminService.GetDoctorSlotsCalendarAsync(id);
            return Ok(result);
        }

        public class GenerateSlotsDto
        {
            public int Days { get; set; } = 30;
        }


    }
}
