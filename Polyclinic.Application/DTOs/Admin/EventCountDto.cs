using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class EventCountDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
