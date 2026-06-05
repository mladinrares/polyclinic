using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polyclinic.Application.Interfaces;
using Polyclinic.Infrastructure.Persistence;

namespace Polyclinic.API.Services
{
    public class WaitingListBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<WaitingListBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30);
        private readonly int _expiryMinutes = 30;

        public WaitingListBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<WaitingListBackgroundService> logger)
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
                    await ProcessExpiredNotificationsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la procesarea listei de așteptare");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task ProcessExpiredNotificationsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PolyclinicDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.UtcNow;
            var today = DateOnly.FromDateTime(now);
            var expiredTime = now.AddHours(-_expiryMinutes);

            // Expira intrarile notificate dar neconfirmate dupa 24h
            var expiredNotified = await context.WaitingLists
                .Where(w => w.Status == "notified" && w.NotifiedAt < expiredTime)
                .ToListAsync();

            foreach (var entry in expiredNotified)
            {
                entry.Status = "expired";
                entry.UpdatedAt = DateTime.UtcNow;

                
                var nextEntry = await context.WaitingLists
                    .Include(w => w.Patient)
                    .Include(w => w.Service)
                    .Include(w => w.Doctor).ThenInclude(d => d.User)
                    .Where(w =>
                        w.DoctorId == entry.DoctorId &&
                        w.LocationId == entry.LocationId &&
                        w.ServiceId == entry.ServiceId &&
                        w.Status == "waiting" &&
                        w.CreatedAt > entry.CreatedAt)
                    .OrderBy(w => w.CreatedAt)
                    .FirstOrDefaultAsync();

                if (nextEntry != null)
                {
                    await notificationService.CreateNotificationAsync(
                        nextEntry.PatientId,
                        "Slot disponibil!",
                        "A expirat confirmarea anterioară. Intră în aplicație pentru a te programa.",
                        "waiting_list_slot_available"
                    );

                    try
                    {
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                        await emailService.SendWaitingListNotificationAsync(
                            nextEntry.Patient.Email,
                            nextEntry.Patient.FirstName,
                            $"Dr. {nextEntry.Doctor.User.FirstName} {nextEntry.Doctor.User.LastName}",
                            nextEntry.Service?.Name ?? "Consultație",
                            entry.NotifiedSlotDate?.ToString("dd MMMM yyyy") ?? "—",
                            entry.NotifiedSlotTime?.ToString(@"hh\:mm") ?? "—"
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Eroare la trimiterea email-ului waiting list");
                    }

                    nextEntry.Status = "notified";
                    nextEntry.NotifiedAt = DateTime.UtcNow;
                    nextEntry.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Expira intrarile cu data preferata trecuta
            var expiredByDate = await context.WaitingLists
                .Where(w => w.Status == "waiting" && w.PreferredDateTo < today)
                .ToListAsync();

            foreach (var entry in expiredByDate)
            {
                entry.Status = "expired";
                entry.UpdatedAt = DateTime.UtcNow;
            }

            if (expiredNotified.Any() || expiredByDate.Any())
            {
                await context.SaveChangesAsync();
                _logger.LogInformation($"Procesate {expiredNotified.Count} notificări expirate și {expiredByDate.Count} intrări expirate din waiting list");
            }
        }
    }
}
