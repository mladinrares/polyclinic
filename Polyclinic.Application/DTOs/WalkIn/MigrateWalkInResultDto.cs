using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.WalkIn
{
    public class MigrateWalkInResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
