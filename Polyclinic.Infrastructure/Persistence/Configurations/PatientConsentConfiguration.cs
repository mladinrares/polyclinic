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
    public class PatientConsentConfiguration : IEntityTypeConfiguration<PatientConsent>
    {
        public void Configure(EntityTypeBuilder<PatientConsent> builder)
        {
            builder.ToTable("PatientConsents");
            builder.HasKey(pc => pc.Id);

            builder.Property(pc => pc.ConsentType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(pc => pc.Version)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(pc => pc.IpAddress)
                .HasMaxLength(45);

            builder.Property(pc => pc.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(pc => pc.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(pc => pc.Patient)
                .WithMany(u => u.PatientConsents)
                .HasForeignKey(pc => pc.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
