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
    public class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
    {
        public void Configure(EntityTypeBuilder<TimeSlot> builder)
        {
            builder.ToTable("TimeSlots");
            builder.HasKey(t => t.Id);

            builder.Property(t => t.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(t => t.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(t => t.Doctor)
                .WithMany(d => d.TimeSlots)
                .HasForeignKey(t => t.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Location)
                .WithMany(l => l.TimeSlots)
                .HasForeignKey(t => t.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Service)
                .WithMany()
                .HasForeignKey(t => t.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(t => new { t.DoctorId, t.LocationId, t.SlotDate, t.StartTime })
                .IsUnique();
        }
    }
}
