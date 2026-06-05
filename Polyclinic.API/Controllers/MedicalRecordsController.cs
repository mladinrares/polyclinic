using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Polyclinic.API.Services;
using Polyclinic.Application.DTOs.Medical;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MedicalRecordsController : ControllerBase
    {
        private readonly IMedicalRecordService _medicalRecordService;
        private readonly PdfService _pdfService;

        public MedicalRecordsController(IMedicalRecordService medicalRecordService)
        {
            _medicalRecordService = medicalRecordService;
            _pdfService = new PdfService();
        }

        [HttpPost]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CreateMedicalRecord([FromBody] CreateMedicalRecordDto dto)
        {
            var doctorUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var doctor = await GetDoctorIdFromUserId(doctorUserId);
            var result = await _medicalRecordService.CreateMedicalRecordAsync(doctor, dto);
            return Ok(result);
        }

        [HttpGet("appointment/{appointmentId}")]
        public async Task<IActionResult> GetByAppointment(Guid appointmentId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _medicalRecordService.GetMedicalRecordByAppointmentAsync(appointmentId, userId);
            return Ok(result);
        }

        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _medicalRecordService.GetPatientMedicalHistoryAsync(userId);
            return Ok(result);
        }

        [HttpGet("patient/{patientId}")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetPatientHistory(Guid patientId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var doctor = await HttpContext.RequestServices
                .GetRequiredService<Polyclinic.Infrastructure.Persistence.PolyclinicDbContext>()
                .Doctors.FirstOrDefaultAsync(d => d.UserId == userId)
                ?? throw new NotFoundException("Doctorul nu a fost găsit");

            var result = await _medicalRecordService.GetPatientHistoryForDoctorAsync(patientId, doctor.Id);
            return Ok(result);
        }
        [HttpGet("{appointmentId}/pdf")]
        public async Task<IActionResult> DownloadPdf(Guid appointmentId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var record = await _medicalRecordService.GetMedicalRecordByAppointmentAsync(appointmentId, userId);
            var pdf = _pdfService.GenerateMedicalRecordPdf(record);

            return File(pdf, "application/pdf", $"fisa-medicala-{appointmentId}.pdf");
        }

        private async Task<Guid> GetDoctorIdFromUserId(Guid userId)
        {
            var doctor = await HttpContext.RequestServices
                .GetRequiredService<Polyclinic.Infrastructure.Persistence.PolyclinicDbContext>()
                .Doctors.FirstOrDefaultAsync(d => d.UserId == userId)
                ?? throw new Polyclinic.Application.Exceptions.NotFoundException("Doctorul nu a fost găsit");

            return doctor.Id;
        }

    }
}
