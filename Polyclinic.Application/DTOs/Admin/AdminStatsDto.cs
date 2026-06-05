using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.Admin
{
    public class AdminStatsDto
    {
        public int TotalPatients { get; set; }
        public int TotalDoctors { get; set; }
        public int TotalAppointments { get; set; }
        public int AppointmentsToday { get; set; }
        public int AppointmentsThisMonth { get; set; }
        public int PendingAppointments { get; set; }
        public int CancelledAppointments { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public List<AppointmentsByDayDto> AppointmentsByDay { get; set; } = new();
    }

    public class AppointmentsByDayDto
    {
        public string Day { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
