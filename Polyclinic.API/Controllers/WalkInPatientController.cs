using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.DTOs.WalkIn;
using Polyclinic.Application.Interfaces;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/walkin-patients")]
    [Authorize(Roles = "receptionist,admin")]
    public class WalkInPatientsController : ControllerBase
    {
        private readonly IWalkInPatientService _walkInPatientService;

        public WalkInPatientsController(IWalkInPatientService walkInPatientService)
        {
            _walkInPatientService = walkInPatientService;
        }

        

        [HttpGet("by-cnp/{cnp}")]
        public async Task<IActionResult> GetByCNP(string cnp)
        {
            var result = await _walkInPatientService.GetByCNPAsync(cnp);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWalkInPatientDto dto)
        {
            var result = await _walkInPatientService.CreateAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateWalkInPatientDto dto)
        {
            var result = await _walkInPatientService.UpdateAsync(id, dto);
            return Ok(result);
        }
        [HttpPost("{id}/migrate")]
        public async Task<IActionResult> MigrateToAccount(Guid id)
        {
            var result = await _walkInPatientService.MigrateToAccountAsync(id);
            if (!result.Success) return BadRequest(new { message = result.Message });
            return Ok(result);
        }
        [HttpPost("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(Guid id)
        {
            await _walkInPatientService.DeactivateAsync(id);
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool showInactive = false)
        {
            var result = await _walkInPatientService.GetAllAsync(search, page, pageSize, showInactive);
            return Ok(result);
        }

        [HttpPost("{id}/reactivate")]
        public async Task<IActionResult> Reactivate(Guid id)
        {
            await _walkInPatientService.ReactivateAsync(id);
            return Ok();
        }
    }
}
