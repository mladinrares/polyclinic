using Microsoft.EntityFrameworkCore;
using Polyclinic.Application.DTOs.Reviews;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class ReviewService : IReviewService
    {
        private readonly PolyclinicDbContext _context;

        public ReviewService(PolyclinicDbContext context)
        {
            _context = context;
        }

        public async Task<ReviewDto> CreateReviewAsync(Guid patientId, CreateReviewDto dto)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId && a.PatientId == patientId)
                ?? throw new NotFoundException("Programarea nu a fost găsită");

            if (appointment.Status != "completed")
                throw new BadRequestException("Poți lăsa o recenzie doar după finalizarea consultației");

            var existingReview = await _context.Reviews
                .AnyAsync(r => r.AppointmentId == dto.AppointmentId);

            if (existingReview)
                throw new ConflictException("Ai lăsat deja o recenzie pentru această programare");

            if (dto.Rating < 1 || dto.Rating > 5)
                throw new BadRequestException("Rating-ul trebuie să fie între 1 și 5");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = appointment.DoctorId,
                AppointmentId = dto.AppointmentId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                IsVisible = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return new ReviewDto
            {
                Id = review.Id,
                PatientName = "Pacient anonim",
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }

        public async Task<List<ReviewDto>> GetDoctorReviewsAsync(Guid doctorId)
        {
            return await _context.Reviews
                .Include(r => r.Patient)
                .Where(r => r.DoctorId == doctorId && r.IsVisible)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    PatientName = $"{r.Patient.FirstName} {r.Patient.LastName[0]}.",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }
        public async Task<List<ReviewDto>> GetTopReviewsAsync(int count = 6)
        {
            return await _context.Reviews
                .Include(r => r.Patient)
                .Include(r => r.Doctor).ThenInclude(d => d.User)
                .Where(r => r.Rating >= 4)
                .OrderByDescending(r => r.CreatedAt)
                .Take(count)
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    PatientName = $"{r.Patient.FirstName} {r.Patient.LastName}",
                    DoctorName = $"Dr. {r.Doctor.User.FirstName} {r.Doctor.User.LastName}",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }
        public async Task<double> GetAverageRatingAsync()
        {
            var count = await _context.Reviews.CountAsync();
            if (count == 0) return 5;


            return Math.Round(await _context.Reviews.AverageAsync(r => (double)r.Rating), 1);
        }
    }
}
