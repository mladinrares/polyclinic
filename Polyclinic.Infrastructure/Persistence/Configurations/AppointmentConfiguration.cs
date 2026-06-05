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
    public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
    {
        public void Configure(EntityTypeBuilder<Appointment> builder)
        {
            builder.ToTable("Appointments");

            builder.Property(a => a.PatientId)
                .IsRequired(false);

            builder.Property(a => a.WalkInPatientId)
                .IsRequired(false);


            builder.HasKey(a => a.Id);

            builder.Property(a => a.Status)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(a => a.Type)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(a => a.PricePaid)
                .HasColumnType("decimal(10,2)");

            builder.Property(a => a.PaymentStatus)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(a => a.CancellationReason)
                .HasMaxLength(500);

            builder.Property(a => a.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(a => a.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            // Relatii
            builder.HasOne(a => a.Patient)
                .WithMany(u => u.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.TimeSlot)
                .WithMany()
                .HasForeignKey(a => a.TimeSlotId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Service)
                .WithMany(s => s.Appointments)
                .HasForeignKey(a => a.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Location)
                .WithMany(l => l.Appointments)
                .HasForeignKey(a => a.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.WalkInPatient)
                .WithMany(w => w.Appointments)
                .HasForeignKey(a => a.WalkInPatientId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(a => a.TimeSlotId)
                .IsUnique()
                .HasFilter("\"Status\" != 'cancelled'");
        }
    }
}
