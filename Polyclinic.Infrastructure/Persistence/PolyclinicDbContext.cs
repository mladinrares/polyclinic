using Microsoft.EntityFrameworkCore;
using Polyclinic.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Infrastructure.Persistence
{
    public class PolyclinicDbContext : DbContext
    {
        public PolyclinicDbContext(DbContextOptions<PolyclinicDbContext> options)
            : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Doctor> Doctors => Set<Doctor>();
        public DbSet<Specialty> Specialties => Set<Specialty>();
        public DbSet<MedicalService> MedicalServices => Set<MedicalService>();
        public DbSet<Location> Locations => Set<Location>();
        public DbSet<DoctorLocation> DoctorLocations => Set<DoctorLocation>();
        public DbSet<DoctorService> DoctorServices => Set<DoctorService>();
        public DbSet<TimeSlot> TimeSlots => Set<TimeSlot>();
        public DbSet<Appointment> Appointments => Set<Appointment>();
        public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
        public DbSet<Prescription> Prescriptions => Set<Prescription>();
        public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
        public DbSet<Investigation> Investigations => Set<Investigation>();
        public DbSet<Referral> Referrals => Set<Referral>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<Document> Documents => Set<Document>();
        public DbSet<InsuranceCard> InsuranceCards => Set<InsuranceCard>();
        public DbSet<PatientConsent> PatientConsents => Set<PatientConsent>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<WaitingList> WaitingLists => Set<WaitingList>();
        public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<AnalyticsEvent> AnalyticsEvents => Set<AnalyticsEvent>();
        public DbSet<WalkInPatient> WalkInPatients => Set<WalkInPatient>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(PolyclinicDbContext).Assembly);
        }
        
    }
}
