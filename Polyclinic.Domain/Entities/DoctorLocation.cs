namespace Polyclinic.Domain.Entities
{
    public class DoctorLocation : BaseEntity
    {
        public Guid DoctorId { get; set; }
        public Guid LocationId { get; set; }
        public Guid? ServiceId { get; set; }
        public string WorkingDays { get; set; } = string.Empty; // Ex: "Luni-Vineri"
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsActive { get; set; } = true;

        // Relatii
        public Doctor Doctor { get; set; } = null!;
        public Location Location { get; set; } = null!;
        public MedicalService? Service { get; set; }
    }
}
