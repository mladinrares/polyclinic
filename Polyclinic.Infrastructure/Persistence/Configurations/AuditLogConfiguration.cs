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
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");
            builder.HasKey(a => a.Id);

            builder.Property(a => a.EntityType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(a => a.Action)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(a => a.OldValues)
                .HasColumnType("jsonb");

            builder.Property(a => a.NewValues)
                .HasColumnType("jsonb");

            builder.Property(a => a.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(a => a.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
