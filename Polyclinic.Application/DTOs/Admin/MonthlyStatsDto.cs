using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class MonthlyStatsDto
    {
        public string Month { get; set; } = string.Empty;
        public int Appointments { get; set; }
        public decimal Revenue { get; set; }
        public int Cancellations { get; set; }
    }
}
