using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.DTOs.Reviews;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetDoctorReviews(Guid doctorId)
        {
            var result = await _reviewService.GetDoctorReviewsAsync(doctorId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            var patientId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var result = await _reviewService.CreateReviewAsync(patientId, dto);
            return Ok(result);
        }
        [HttpGet("top")]
        public async Task<IActionResult> GetTopReviews([FromQuery] int count = 6)
        {
            var result = await _reviewService.GetTopReviewsAsync(count);
            return Ok(result);
        }
        [HttpGet("average")]
        public async Task<IActionResult> GetAverageRating()
        {
            var result = await _reviewService.GetAverageRatingAsync();
            return Ok(result);
        }
    }
}
