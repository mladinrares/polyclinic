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
    public class WaitingListConfiguration : IEntityTypeConfiguration<WaitingList>
    {
        public void Configure(EntityTypeBuilder<WaitingList> builder)
        {
            builder.ToTable("WaitingList");
            builder.HasKey(w => w.Id);

            builder.Property(w => w.Status)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(w => w.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(w => w.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(w => w.Patient)
                .WithMany(u => u.WaitingList)
                .HasForeignKey(w => w.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(w => w.Doctor)
                .WithMany()
                .HasForeignKey(w => w.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(w => w.Service)
                .WithMany(s => s.WaitingList)
                .HasForeignKey(w => w.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(w => w.Location)
                .WithMany(l => l.WaitingList)
                .HasForeignKey(w => w.LocationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
