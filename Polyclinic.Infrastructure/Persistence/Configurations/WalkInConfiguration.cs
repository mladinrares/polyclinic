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
    public class WalkInPatientConfiguration : IEntityTypeConfiguration<WalkInPatient>
    {
        public void Configure(EntityTypeBuilder<WalkInPatient> builder)
        {
            builder.HasKey(w => w.Id);

            builder.Property(w => w.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(w => w.LastName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(w => w.CNP)
                .IsRequired()
                .HasMaxLength(13);

            builder.Property(w => w.Phone)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(w => w.Age)
                .IsRequired(false);

            builder.Property(w => w.Address)
                .HasMaxLength(200)
                .IsRequired(false);

            builder.Property(w => w.City)
                .HasMaxLength(100)
                .IsRequired(false);

            builder.Property(w => w.Email)
                .HasMaxLength(200)
                .IsRequired(false);

            builder.Property(w => w.IsActive).HasDefaultValue(true);

            builder.HasMany(w => w.InsuranceCards)
                .WithOne(i => i.WalkInPatient)
                .HasForeignKey(i => i.WalkInPatientId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(w => w.Appointments)
                .WithOne(a => a.WalkInPatient)
                .HasForeignKey(a => a.WalkInPatientId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
