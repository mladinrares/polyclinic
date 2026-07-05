using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polyclinic.Infrastructure.Persistence;

namespace Polyclinic.Infrastructure.Services
{
    public class ReferralExpiryBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReferralExpiryBackgroundService> _logger;

        public ReferralExpiryBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<ReferralExpiryBackgroundService> logger)
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
                    await ExpireReferralsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la expirarea referral-urilor");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task ExpireReferralsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PolyclinicDbContext>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var expiredReferrals = await context.Referrals
                .Where(r => r.Status == "active" && r.ValidUntil < today)
                .ToListAsync();

            foreach (var referral in expiredReferrals)
            {
                referral.Status = "expired";
                referral.UpdatedAt = DateTime.UtcNow;
            }

            if (expiredReferrals.Any())
            {
                await context.SaveChangesAsync();
                _logger.LogInformation($"Expirate {expiredReferrals.Count} referral-uri");
            }
        }
    }
}
