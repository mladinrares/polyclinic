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
    public class PrescriptionConfiguration : IEntityTypeConfiguration<Prescription>
    {
        public void Configure(EntityTypeBuilder<Prescription> builder)
        {
            builder.ToTable("Prescriptions");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.PrescriptionNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(p => p.PrescriptionNumber)
                .IsUnique();

            builder.Property(p => p.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(p => p.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(p => p.MedicalRecord)
                .WithMany(m => m.Prescriptions)
                .HasForeignKey(p => p.MedicalRecordId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.Patient)
                .WithMany()
                .HasForeignKey(p => p.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.Doctor)
                .WithMany()
                .HasForeignKey(p => p.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
