using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    

    public class CreateSpecialtyDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
