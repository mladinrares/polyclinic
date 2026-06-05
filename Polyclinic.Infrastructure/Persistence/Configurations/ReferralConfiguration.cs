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
    public class ReferralConfiguration : IEntityTypeConfiguration<Referral>
    {
        public void Configure(EntityTypeBuilder<Referral> builder)
        {
            builder.ToTable("Referrals");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.ReferralNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(r => r.ReferralNumber)
                .IsUnique();

            builder.Property(r => r.Reason)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(r => r.Status)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(r => r.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(r => r.ReferredService)
                .WithMany()
                .HasForeignKey(r => r.ReferredServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.Patient)
                .WithMany()
                .HasForeignKey(r => r.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.ReferringDoctor)
                .WithMany()
                .HasForeignKey(r => r.ReferringDoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.ReferredSpecialty)
                .WithMany(s => s.Referrals)
                .HasForeignKey(r => r.ReferredSpecialtyId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
