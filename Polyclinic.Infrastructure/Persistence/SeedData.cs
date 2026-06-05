using Microsoft.EntityFrameworkCore;
using Polyclinic.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Persistence
{
    public static class SeedData
    {
        public static async Task SeedAsync(PolyclinicDbContext context)
        {
            if (await context.Specialties.AnyAsync()) return;

            var specialties = new List<Specialty>
            {
                new Specialty { Id = Guid.NewGuid(), Name = "Cardiologie", Description = "Boli ale inimii", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Specialty { Id = Guid.NewGuid(), Name = "Dermatologie", Description = "Boli ale pielii", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Specialty { Id = Guid.NewGuid(), Name = "Neurologie", Description = "Boli ale sistemului nervos", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Specialty { Id = Guid.NewGuid(), Name = "Pediatrie", Description = "Medicina copilului", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };

            await context.Specialties.AddRangeAsync(specialties);

            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), Email = "dr.ionescu@policlinica.ro", FirstName = "Alexandru", LastName = "Ionescu", Phone = "0712345678", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doctor123!"), Role = "doctor", IsActive = true, EmailVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new User { Id = Guid.NewGuid(), Email = "dr.popescu@policlinica.ro", FirstName = "Maria", LastName = "Popescu", Phone = "0712345678", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doctor123!"), Role = "doctor", IsActive = true, EmailVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new User { Id = Guid.NewGuid(), Email = "dr.gheorghe@policlinica.ro", FirstName = "Ion", LastName = "Gheorghe", Phone = "0712345678", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Doctor123!"), Role = "doctor", IsActive = true, EmailVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new User { Id = Guid.NewGuid(), Email = "doctor@doctor.com", FirstName = "Ion", LastName = "Gheorghe", Phone = "0712345678", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"), Role = "doctor", IsActive = true, EmailVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };

            await context.Users.AddRangeAsync(users);

            var doctors = new List<Doctor>
            {
                new Doctor { Id = Guid.NewGuid(), UserId = users[0].Id, SpecialtyId = specialties[0].Id, LicenseNumber = "LIC001", Bio = "Cardiolog cu experiență de 15 ani", ExperienceYears = 15, ConsultationFee = 200, IsAvailable = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Doctor { Id = Guid.NewGuid(), UserId = users[1].Id, SpecialtyId = specialties[1].Id, LicenseNumber = "LIC002", Bio = "Dermatolog specializat în afecțiuni cronice", ExperienceYears = 10, ConsultationFee = 150, IsAvailable = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Doctor { Id = Guid.NewGuid(), UserId = users[2].Id, SpecialtyId = specialties[2].Id, LicenseNumber = "LIC003", Bio = "Neurolog cu peste 20 de ani experiență", ExperienceYears = 20, ConsultationFee = 250, IsAvailable = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Doctor { Id = Guid.NewGuid(), UserId = users[3].Id, SpecialtyId = specialties[3].Id, LicenseNumber = "LIC004", Bio = "Pediatru dedicat", ExperienceYears = 8, ConsultationFee = 180, IsAvailable = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };

            await context.Doctors.AddRangeAsync(doctors);
            await context.SaveChangesAsync();

            // Servicii medicale
            var services = new List<MedicalService>
            {
                new MedicalService { Id = Guid.NewGuid(), SpecialtyId = specialties[0].Id, Name = "Consultație cardiologie", DurationMinutes = 30, Price = 200, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new MedicalService { Id = Guid.NewGuid(), SpecialtyId = specialties[1].Id, Name = "Consultație dermatologie", DurationMinutes = 30, Price = 150, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new MedicalService { Id = Guid.NewGuid(), SpecialtyId = specialties[2].Id, Name = "Consultație neurologie", DurationMinutes = 45, Price = 250, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new MedicalService { Id = Guid.NewGuid(), SpecialtyId = specialties[3].Id, Name = "Consultație pediatrie", DurationMinutes = 45, Price = 500, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };

            await context.MedicalServices.AddRangeAsync(services);

            // Locatie
            var location = new Location
            {
                Id = Guid.NewGuid(),
                Name = "Clinica Centrală",
                Address = "Str. Victoriei 10",
                City = "București",
                County = "Ilfov",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await context.Locations.AddAsync(location);

            

            // Legaturi doctor - servicii
            var doctorServices = new List<DoctorService>
            {
                new DoctorService { Id = Guid.NewGuid(), DoctorId = doctors[0].Id, ServiceId = services[0].Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new DoctorService { Id = Guid.NewGuid(), DoctorId = doctors[1].Id, ServiceId = services[1].Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new DoctorService { Id = Guid.NewGuid(), DoctorId = doctors[2].Id, ServiceId = services[2].Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new DoctorService { Id = Guid.NewGuid(), DoctorId = doctors[3].Id, ServiceId = services[3].Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };

            await context.DoctorServices.AddRangeAsync(doctorServices);
            await context.SaveChangesAsync();

            // Legaturi doctor - locatie
            var doctorLocations = new List<DoctorLocation>
            {
                new DoctorLocation { Id = Guid.NewGuid(), DoctorId = doctors[0].Id, LocationId = location.Id, WorkingDays = "Monday,Tuesday,Wednesday,Thursday,Friday", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new DoctorLocation { Id = Guid.NewGuid(), DoctorId = doctors[1].Id, LocationId = location.Id, WorkingDays = "Monday,Tuesday,Wednesday,Thursday,Friday", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new DoctorLocation { Id = Guid.NewGuid(), DoctorId = doctors[2].Id, LocationId = location.Id, WorkingDays = "Monday,Tuesday,Wednesday,Thursday,Friday", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new DoctorLocation { Id = Guid.NewGuid(), DoctorId = doctors[3].Id, LocationId = location.Id, WorkingDays = "Monday,Tuesday,Wednesday,Thursday,Friday", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(13, 0), IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };

            await context.DoctorLocations.AddRangeAsync(doctorLocations);
            await context.SaveChangesAsync();

            await context.SaveChangesAsync();
        }
    }
}
