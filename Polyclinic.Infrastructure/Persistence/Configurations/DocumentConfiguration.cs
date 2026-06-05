using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Polyclinic.Domain.Entities;

namespace Polyclinic.Infrastructure.Persistence.Configurations
{
    public class DocumentConfiguration : IEntityTypeConfiguration<Document>
    {
        public void Configure(EntityTypeBuilder<Document> builder)
        {
            builder.ToTable("Documents");
            builder.HasKey(d => d.Id);

            builder.Property(d => d.Type)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(d => d.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(d => d.FileUrl)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(d => d.MimeType)
                .HasMaxLength(100);

            builder.Property(d => d.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(d => d.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(d => d.Patient)
                .WithMany(u => u.Documents)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(d => d.Appointment)
                .WithMany(a => a.Documents)
                .HasForeignKey(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(d => d.MedicalRecord)
                .WithMany(m => m.Documents)
                .HasForeignKey(d => d.MedicalRecordId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
