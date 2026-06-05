using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class DailyEventDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
