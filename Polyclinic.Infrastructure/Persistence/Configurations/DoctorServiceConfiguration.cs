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
    public class DoctorServiceConfiguration : IEntityTypeConfiguration<DoctorService>
    {
        public void Configure(EntityTypeBuilder<DoctorService> builder)
        {
            builder.ToTable("DoctorServices");
            builder.HasKey(ds => ds.Id);

            builder.HasOne(ds => ds.Doctor)
                .WithMany(d => d.DoctorServices)
                .HasForeignKey(ds => ds.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(ds => ds.Service)
                .WithMany(s => s.DoctorServices)
                .HasForeignKey(ds => ds.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
