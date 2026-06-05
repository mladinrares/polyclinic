using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{

    public class SlotsByDateDto
    {
        public DateOnly Date { get; set; }
        public List<SlotTimeDto> Slots { get; set; } = new();
    }
}
