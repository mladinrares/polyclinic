using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using Polyclinic.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Persistence.Configurations
{
    public class LocationConfiguration : IEntityTypeConfiguration<Location>
    {
        public void Configure(EntityTypeBuilder<Location> builder)
        {
            builder.ToTable("Locations");
            builder.HasKey(l => l.Id);

            builder.Property(l => l.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(l => l.Address)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(l => l.Latitude)
                .HasColumnType("decimal(9,6)");

            builder.Property(l => l.Longitude)
                .HasColumnType("decimal(9,6)");

            builder.Property(l => l.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(l => l.UpdatedAt)
                .HasDefaultValueSql("NOW()");
        }
    }
}
