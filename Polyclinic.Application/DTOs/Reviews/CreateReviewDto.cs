using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Reviews
{
    public class CreateReviewDto
    {
        public Guid AppointmentId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
