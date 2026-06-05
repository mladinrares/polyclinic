using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Medical
{
    public class PrescriptionDto
    {
        public Guid Id { get; set; }
        public string PrescriptionNumber { get; set; } = string.Empty;
        public DateOnly ValidFrom { get; set; }
        public DateOnly ValidUntil { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<PrescriptionItemDto> Items { get; set; } = new();
    }
}
