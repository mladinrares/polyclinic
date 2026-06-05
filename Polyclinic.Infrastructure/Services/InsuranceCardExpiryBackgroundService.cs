using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Services
{
    public class InsuranceCardExpiryBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<InsuranceCardExpiryBackgroundService> _logger;

        public InsuranceCardExpiryBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<InsuranceCardExpiryBackgroundService> logger)
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
                    await ExpireCardsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Eroare la expirarea cardurilor CNAS");
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task ExpireCardsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PolyclinicDbContext>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var expiredCards = await context.InsuranceCards
                .Where(c => c.IsActive && c.ExpiryDate < today)
                .ToListAsync();

            foreach (var card in expiredCards)
            {
                card.IsActive = false;
                card.UpdatedAt = DateTime.UtcNow;
            }

            if (expiredCards.Any())
            {
                await context.SaveChangesAsync();
                _logger.LogInformation($"Dezactivate {expiredCards.Count} carduri CNAS expirate");
            }
        }
    }
}
