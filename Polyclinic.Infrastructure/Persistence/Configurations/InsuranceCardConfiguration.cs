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
    public class InsuranceCardConfiguration : IEntityTypeConfiguration<InsuranceCard>
    {
        public void Configure(EntityTypeBuilder<InsuranceCard> builder)
        {
            builder.ToTable("InsuranceCards");
            builder.HasKey(i => i.Id);

                    builder.Property(i => i.FirstName)
            .IsRequired()
            .HasMaxLength(100);

            builder.Property(i => i.LastName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(i => i.InsuredCode)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(i => i.DocumentNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(i => i.DocumentNumber)
                .IsUnique();

            builder.Property(i => i.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(i => i.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(i => i.PatientId).IsRequired(false);
            builder.Property(i => i.WalkInPatientId).IsRequired(false);

            builder.HasOne(i => i.WalkInPatient)
                .WithMany(w => w.InsuranceCards)
                .HasForeignKey(i => i.WalkInPatientId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(i => i.Patient)
                .WithMany(u => u.InsuranceCards)
                .HasForeignKey(i => i.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
