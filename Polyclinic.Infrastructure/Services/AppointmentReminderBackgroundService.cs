using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polyclinic.Application.Interfaces;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class AppointmentReminderBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AppointmentReminderBackgroundService> _logger;

        public AppointmentReminderBackgroundService(IServiceProvider serviceProvider, ILogger<AppointmentReminderBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendRemindersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la trimiterea reminder-elor");
                }
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task SendRemindersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PolyclinicDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

            var appointments = await context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.WalkInPatient)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Service)
                .Include(a => a.TimeSlot)
                .Where(a =>
                    a.Status == "confirmed" &&
                    a.TimeSlot.SlotDate == tomorrow)
                .ToListAsync();

            foreach (var appointment in appointments)
            {
                try
                {
                    string? email = null;
                    string? firstName = null;

                    if (appointment.PatientId != null && appointment.Patient != null)
                    {
                        email = appointment.Patient.Email;
                        firstName = appointment.Patient.FirstName;
                    }
                    else if (appointment.WalkInPatientId != null && appointment.WalkInPatient != null)
                    {
                        email = appointment.WalkInPatient.Email;
                        firstName = appointment.WalkInPatient.FirstName;
                    }

                    // skip daca nu are email
                    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(firstName)) continue;

                    await emailService.SendAppointmentReminderAsync(
                        email,
                        firstName,
                        $"Dr. {appointment.Doctor.User.FirstName} {appointment.Doctor.User.LastName}",
                        appointment.Service.Name,
                        tomorrow.ToString("dd MMMM yyyy"),
                        appointment.TimeSlot.StartTime.ToString(@"hh\:mm")
                    );

                    _logger.LogInformation("Reminder trimis pentru {Email}", email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la trimiterea reminder-ului");
                }
            }
        }
    }
}
