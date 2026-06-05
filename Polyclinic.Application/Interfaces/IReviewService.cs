using Polyclinic.Application.DTOs.Reviews;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewDto> CreateReviewAsync(Guid patientId, CreateReviewDto dto);
        Task<List<ReviewDto>> GetDoctorReviewsAsync(Guid doctorId);
        Task<List<ReviewDto>> GetTopReviewsAsync(int count = 6);
        Task<double> GetAverageRatingAsync();
    }
}
