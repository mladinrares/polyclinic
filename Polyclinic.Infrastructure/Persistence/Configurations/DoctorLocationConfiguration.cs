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
    public class DoctorLocationConfiguration : IEntityTypeConfiguration<DoctorLocation>
    {
        public void Configure(EntityTypeBuilder<DoctorLocation> builder)
        {
            builder.ToTable("DoctorLocations");
            builder.HasKey(dl => dl.Id);

            builder.Property(dl => dl.WorkingDays)
                .HasMaxLength(200);

            builder.Property(dl => dl.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(dl => dl.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(dl => dl.Doctor)
                .WithMany(d => d.DoctorLocations)
                .HasForeignKey(dl => dl.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(dl => dl.Location)
                .WithMany(l => l.DoctorLocations)
                .HasForeignKey(dl => dl.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(dl => dl.Service)
                .WithMany()
                .HasForeignKey(dl => dl.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
