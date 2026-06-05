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
    public class PrescriptionItemConfiguration : IEntityTypeConfiguration<PrescriptionItem>
    {
        public void Configure(EntityTypeBuilder<PrescriptionItem> builder)
        {
            builder.ToTable("PrescriptionItems");
            builder.HasKey(pi => pi.Id);

            builder.Property(pi => pi.MedicationName)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(pi => pi.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(pi => pi.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(pi => pi.Prescription)
                .WithMany(p => p.Items)
                .HasForeignKey(pi => pi.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
