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
    public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
    {
        public void Configure(EntityTypeBuilder<InvoiceItem> builder)
        {
            builder.ToTable("InvoiceItems");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.UnitPrice)
                .HasColumnType("decimal(10,2)");

            builder.Property(i => i.TotalPrice)
                .HasColumnType("decimal(10,2)");

            builder.Property(i => i.Description)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(i => i.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(i => i.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(i => i.Appointment)
                .WithMany(a => a.InvoiceItems)
                .HasForeignKey(i => i.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.AddedByUser)
                .WithMany()
                .HasForeignKey(i => i.AddedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
