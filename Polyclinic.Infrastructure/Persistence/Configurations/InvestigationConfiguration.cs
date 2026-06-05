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
    public class InvestigationConfiguration : IEntityTypeConfiguration<Investigation>
    {
        public void Configure(EntityTypeBuilder<Investigation> builder)
        {
            builder.ToTable("Investigations");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.Type)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(i => i.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(i => i.Status)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(i => i.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(i => i.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(i => i.MedicalRecord)
                .WithMany(m => m.Investigations)
                .HasForeignKey(i => i.MedicalRecordId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Patient)
                .WithMany()
                .HasForeignKey(i => i.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Doctor)
                .WithMany()
                .HasForeignKey(i => i.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
