using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Polyclinic.Application.DTOs.Appointments;
using Polyclinic.Application.Exceptions;
using Polyclinic.Application.Interfaces;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using Polyclinic.Infrastructure.Services;
using Polyclinic.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Tests
{
    public class AppointmentServiceTests
    {
        private readonly Mock<INotificationService> _notificationMock = new();
        private readonly Mock<IAuditService> _auditMock = new();
        private readonly Mock<IEmailService> _emailMock = new();
        private readonly Mock<ILogger<AppointmentService>> _loggerMock = new();

        private AppointmentService CreateService(out PolyclinicDbContext context)
        {
            context = TestDbContextFactory.Create();
            return new AppointmentService(
                context,
                _notificationMock.Object,
                _auditMock.Object,
                _emailMock.Object,
                _loggerMock.Object
            );
        }

        // ── GetAvailableSlots ──────────────────────────────────────────────

        [Fact]
        public async Task GetAvailableSlots_ReturnsOnlyAvailableSlots()
        {
            var service = CreateService(out var context);
            var doctorId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

            context.TimeSlots.AddRange(
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = date, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(9, 30), IsAvailable = true, IsBlocked = false },
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = date, StartTime = new TimeOnly(9, 30), EndTime = new TimeOnly(10, 0), IsAvailable = false, IsBlocked = false },
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = date, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(10, 30), IsAvailable = true, IsBlocked = true }
            );
            await context.SaveChangesAsync();

            var result = await service.GetAvailableSlotsAsync(doctorId, locationId, date);

            result.Should().HaveCount(1);
            result[0].StartTime.Should().Be(new TimeOnly(9, 0));
        }

        [Fact]
        public async Task GetAvailableSlots_FiltersByServiceId()
        {
            var service = CreateService(out var context);
            var doctorId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

            context.TimeSlots.AddRange(
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = date, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(9, 30), IsAvailable = true, IsBlocked = false, ServiceId = serviceId },
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = date, StartTime = new TimeOnly(9, 30), EndTime = new TimeOnly(10, 0), IsAvailable = true, IsBlocked = false, ServiceId = Guid.NewGuid() }
            );
            await context.SaveChangesAsync();

            var result = await service.GetAvailableSlotsAsync(doctorId, locationId, date, serviceId);

            result.Should().HaveCount(1);
        }

        // ── CancelAppointment ──────────────────────────────────────────────

        [Fact]
        public async Task CancelAppointment_ReleasesSlot()
        {
            var svc = CreateService(out var context);
            var patientId = Guid.NewGuid();
            var slotId = Guid.NewGuid();

            var user = new User { Id = patientId, Email = "test@test.com", FirstName = "Ion", LastName = "Pop", Role = "patient", IsActive = true, PasswordHash = "x", Phone = "0700000000" };
            var slot = new TimeSlot { Id = slotId,
                DoctorId = Guid.NewGuid(),
                LocationId = Guid.NewGuid(),
                SlotDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(9, 30),
                IsAvailable = false,
                IsBlocked = false };
            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = slot.DoctorId,
                TimeSlotId = slotId,
                ServiceId = Guid.NewGuid(),
                LocationId = slot.LocationId,
                Status = "confirmed",
                Type = "in_person",
                PricePaid = 100,
                PaymentStatus = "unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(user);
            context.TimeSlots.Add(slot);
            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            await svc.CancelAppointmentAsync(appointment.Id, patientId, "Test", "patient");

            var updatedSlot = await context.TimeSlots.FindAsync(slotId);
            updatedSlot!.IsAvailable.Should().BeTrue();
        }

        [Fact]
        public async Task CancelAppointment_SetsStatusToCancelled()
        {
            var svc = CreateService(out var context);
            var patientId = Guid.NewGuid();
            var slotId = Guid.NewGuid();

            var user = new User { Id = patientId, Email = "test@test.com", FirstName = "Ion", LastName = "Pop", Role = "patient", IsActive = true, PasswordHash = "x", Phone = "0700000001" };
            var slot = new TimeSlot { Id = slotId, DoctorId = Guid.NewGuid(), LocationId = Guid.NewGuid(), SlotDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(9, 30), IsAvailable = false, IsBlocked = false };
            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = slot.DoctorId,
                TimeSlotId = slotId,
                ServiceId = Guid.NewGuid(),
                LocationId = slot.LocationId,
                Status = "confirmed",
                Type = "in_person",
                PricePaid = 100,
                PaymentStatus = "unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(user);
            context.TimeSlots.Add(slot);
            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            await svc.CancelAppointmentAsync(appointment.Id, patientId, "Motiv test", "patient");

            var updated = await context.Appointments.FindAsync(appointment.Id);
            updated!.Status.Should().Be("cancelled");
            updated.CancellationReason.Should().Be("Motiv test");
        }

        [Fact]
        public async Task CancelAppointment_ThrowsForbidden_WhenNotOwner()
        {
            var svc = CreateService(out var context);
            var patientId = Guid.NewGuid();
            var otherId = Guid.NewGuid();
            var slotId = Guid.NewGuid();

            var user = new User { Id = otherId, Email = "other@test.com", FirstName = "Alt", LastName = "User", Role = "patient", IsActive = true, PasswordHash = "x", Phone = "0700000002" };
            var slot = new TimeSlot { Id = slotId,
                DoctorId = Guid.NewGuid(),
                LocationId = Guid.NewGuid(),
                SlotDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(9, 30),
                IsAvailable = false,
                IsBlocked = false };

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = slot.DoctorId,
                TimeSlotId = slotId,
                ServiceId = Guid.NewGuid(),
                LocationId = slot.LocationId,
                Status = "confirmed",
                Type = "in_person",
                PricePaid = 100,
                PaymentStatus = "unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(user);
            context.TimeSlots.Add(slot);
            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            await svc.Invoking(s => s.CancelAppointmentAsync(appointment.Id, otherId, "Test", "patient"))
                .Should().ThrowAsync<ForbiddenException>();
        }

        // ── CompleteAppointment ────────────────────────────────────────────

        [Fact]
        public async Task CompleteAppointment_SetsStatusToCompleted()
        {
            var svc = CreateService(out var context);
            var doctorId = Guid.NewGuid();

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                PatientId = Guid.NewGuid(),
                DoctorId = doctorId,
                TimeSlotId = Guid.NewGuid(),
                ServiceId = Guid.NewGuid(),
                LocationId = Guid.NewGuid(),
                Status = "confirmed",
                Type = "in_person",
                PricePaid = 100,
                PaymentStatus = "unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            await svc.CompleteAppointmentAsync(appointment.Id, doctorId);

            var updated = await context.Appointments.FindAsync(appointment.Id);
            updated!.Status.Should().Be("completed");
            updated.CompletedAt.Should().NotBeNull();
        }

        [Fact]
        public async Task CompleteAppointment_ThrowsBadRequest_WhenAlreadyCompleted()
        {
            var svc = CreateService(out var context);
            var doctorId = Guid.NewGuid();

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                PatientId = Guid.NewGuid(),
                DoctorId = doctorId,
                TimeSlotId = Guid.NewGuid(),
                ServiceId = Guid.NewGuid(),
                LocationId = Guid.NewGuid(),
                Status = "completed",
                Type = "in_person",
                PricePaid = 100,
                PaymentStatus = "unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Appointments.Add(appointment);
            await context.SaveChangesAsync();

            await svc.Invoking(s => s.CompleteAppointmentAsync(appointment.Id, doctorId))
                .Should().ThrowAsync<BadRequestException>();
        }

        // ── AddToWaitingList ───────────────────────────────────────────────

        [Fact]
        public async Task AddToWaitingList_ThrowsConflict_WhenAlreadyOnList()
        {
            var svc = CreateService(out var context);
            var patientId = Guid.NewGuid();
            var doctorId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();

            context.WaitingLists.Add(new WaitingList
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                DoctorId = doctorId,
                ServiceId = serviceId,
                LocationId = Guid.NewGuid(),
                Status = "waiting",
                PreferredDateFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                PreferredDateTo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            await svc.Invoking(s => s.AddToWaitingListAsync(patientId, new AddToWaitingListDto
            {
                DoctorId = doctorId,
                ServiceId = serviceId,
                LocationId = Guid.NewGuid(),
                PreferredDateFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                PreferredDateTo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))
            })).Should().ThrowAsync<ConflictException>();
        }

        // ── GetFirstAvailableDate ──────────────────────────────────────────

        [Fact]
        public async Task GetFirstAvailableDate_ReturnsEarliestDate()
        {
            var svc = CreateService(out var context);
            var doctorId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            context.TimeSlots.AddRange(
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = today.AddDays(3), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(9, 30), IsAvailable = true, IsBlocked = false },
                new TimeSlot { Id = Guid.NewGuid(), DoctorId = doctorId, LocationId = locationId, SlotDate = today.AddDays(1), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(9, 30), IsAvailable = true, IsBlocked = false }
            );
            await context.SaveChangesAsync();

            var result = await svc.GetFirstAvailableDateAsync(doctorId, locationId);

            result.Should().Be(today.AddDays(1));
        }

        [Fact]
        public async Task GetFirstAvailableDate_ReturnsNull_WhenNoSlots()
        {
            var svc = CreateService(out var context);

            var result = await svc.GetFirstAvailableDateAsync(Guid.NewGuid(), Guid.NewGuid());

            result.Should().BeNull();
        }
    }
}
