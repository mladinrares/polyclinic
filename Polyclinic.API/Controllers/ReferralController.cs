using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.API.Services;
using Polyclinic.Application.DTOs.Referrals;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReferralsController : ControllerBase
    {
        private readonly IReferralService _referralService;
        private readonly PdfService _pdfService;

        public ReferralsController(IReferralService referralService, PdfService pdfService)
        {
            _referralService = referralService;
            _pdfService = pdfService;
        }

        [HttpPost]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CreateReferral([FromBody] CreateReferralDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _referralService.CreateReferralAsync(userId, dto);
            return Ok(result);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyReferrals()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _referralService.GetPatientReferralsAsync(userId);
            return Ok(result);
        }

        [HttpGet("issued")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetIssuedReferrals()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _referralService.GetDoctorIssuedReferralsAsync(userId);
            return Ok(result);
        }

        [HttpGet("valid")]
        public async Task<IActionResult> GetValidReferral([FromQuery] Guid serviceId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _referralService.GetValidReferralAsync(userId, serviceId);
            if (result == null)
                return Ok(new { hasReferral = false });

            return Ok(new { hasReferral = true, referral = result });
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DownloadReferralPdf(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var referrals = await _referralService.GetPatientReferralsAsync(userId);
            var referral = referrals.FirstOrDefault(r => r.Id == id);

            if (referral == null)
            {
                var issuedReferrals = await _referralService.GetDoctorIssuedReferralsAsync(userId);
                referral = issuedReferrals.FirstOrDefault(r => r.Id == id);
            }

            if (referral == null)
                return NotFound();

            var pdf = _pdfService.GenerateReferralPdf(referral);
            return File(pdf, "application/pdf", $"referral-{referral.ReferralNumber}.pdf");
        }
    }
}
