using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class AnalyticsSummaryDto
    {
        public int TotalEvents { get; set; }
        public int UniqueUsers { get; set; }
        public List<EventCountDto> TopEvents { get; set; } = new();
        public List<EventCountDto> TopPages { get; set; } = new();
        public List<EventCountDto> TopSearches { get; set; } = new();
        public List<EventCountDto> TopSpecialties { get; set; } = new();
        public List<DailyEventDto> DailyEvents { get; set; } = new();
    }
}
