using Microsoft.EntityFrameworkCore;
using Polyclinic.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Tests.Helpers
{
    public static class TestDbContextFactory
    {
        public static PolyclinicDbContext Create()
        {
            var options = new DbContextOptionsBuilder<PolyclinicDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new PolyclinicDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }
    }
}
