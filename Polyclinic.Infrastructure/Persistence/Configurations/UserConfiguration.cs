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
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            builder.HasIndex(u => u.Email)
                .IsUnique();

            builder.Property(u => u.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.LastName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.PasswordHash)
                .HasMaxLength(512);

            builder.Property(u => u.GoogleId)
                .HasMaxLength(256);

            builder.Property(u => u.FacebookId)
                .HasMaxLength(256);

            builder.Property(u => u.Phone)
                .HasMaxLength(20);

            builder.Property(u => u.County)
                .HasMaxLength(30);

            builder.Property(u => u.CNP)
                .HasMaxLength(13);

            builder.HasIndex(u => u.CNP)
                .IsUnique();

            builder.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(u => u.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(u => u.UpdatedAt)
                .HasDefaultValueSql("NOW()");
        }
    }
}
