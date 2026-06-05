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
    public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
    {
        public void Configure(EntityTypeBuilder<Doctor> builder)
        {
            builder.ToTable("Doctors");
            builder.HasKey(d => d.Id);

            builder.Property(d => d.LicenseNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(d => d.LicenseNumber)
                .IsUnique();

            builder.Property(d => d.ConsultationFee)
                .HasColumnType("decimal(10,2)");

            builder.Property(d => d.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(d => d.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(d => d.User)
                .WithOne()
                .HasForeignKey<Doctor>(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(d => d.Specialty)
                .WithMany(s => s.Doctors)
                .HasForeignKey(d => d.SpecialtyId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
