using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Doctors;
using Polyclinic.Application.Interfaces;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly IDoctorService _doctorService;

        public DoctorsController(IDoctorService doctorService)
        {
            _doctorService = doctorService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDoctors([FromQuery] DoctorFilterDto filter)
        {
            var result = await _doctorService.GetDoctorsAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDoctor(Guid id)
        {
            var result = await _doctorService.GetDoctorByIdAsync(id);
            return Ok(result);
        }
        [HttpGet("{id}/services")]
        public async Task<IActionResult> GetDoctorServices(Guid id)
        {
            var result = await _doctorService.GetDoctorServicesAsync(id);
            return Ok(result);
        }
        [HttpGet("specialties")]
        public async Task<IActionResult> GetSpecialties()
        {
            var result = await _doctorService.GetSpecialtiesAsync();
            return Ok(result);
        }
        [HttpGet("locations")]
        public async Task<IActionResult> GetLocations()
        {
            var result = await _doctorService.GetLocationsAsync();
            return Ok(result);
        }
        [HttpGet("{id}/all-services")]
        public async Task<IActionResult> GetAllDoctorServices(Guid id)
        {
            var result = await _doctorService.GetAllDoctorServicesAsync(id);
            return Ok(result);
        }
        [HttpGet("{id}/services/location/{locationId}")]
        public async Task<IActionResult> GetDoctorServicesByLocation(Guid id, Guid locationId)
        {
            var result = await _doctorService.GetDoctorServicesByLocationAsync(id, locationId);
            return Ok(result);
        }
        [HttpGet("specialties/{specialtyId}/services")]
        public async Task<IActionResult> GetServicesBySpecialty(Guid specialtyId)
        {
            var result = await _doctorService.GetServicesBySpecialtyAsync(specialtyId);
            return Ok(result);
        }

        [HttpGet("services/cnas")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCNASServices()
        {
            var result = await _doctorService.GetCNASServicesAsync();
            return Ok(result);
        }
        [HttpGet("stats/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicStats()
        {
            var result = await _doctorService.GetPublicStatsAsync();
            return Ok(result);
        }
    }
}
