using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Polyclinic.Domain.Entities;

namespace Polyclinic.Infrastructure.Persistence.Configurations
{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.ToTable("RefreshTokens");
            builder.HasKey(rt => rt.Id);

            builder.Property(rt => rt.Token)
                .IsRequired();

            builder.Property(r => r.IpAddress)
                .HasMaxLength(45);

            builder.Property(r => r.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("NOW()");

            builder.HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }

    }
}
