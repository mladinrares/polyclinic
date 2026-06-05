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
    public class MedicalServiceConfiguration : IEntityTypeConfiguration<MedicalService>
    {
        public void Configure(EntityTypeBuilder<MedicalService> builder)
        {
            builder.ToTable("MedicalServices");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(s => s.Price)
                .HasColumnType("decimal(10,2)");

            builder.Property(s => s.CNASCoveredAmount)
                .HasColumnType("decimal(10,2)");

            builder.Property(s => s.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(s => s.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(s => s.Specialty)
                .WithMany(sp => sp.MedicalServices)
                .HasForeignKey(s => s.SpecialtyId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
