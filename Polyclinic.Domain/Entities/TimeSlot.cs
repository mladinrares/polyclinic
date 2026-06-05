namespace Polyclinic.Domain.Entities
{
    public class TimeSlot : BaseEntity
    {
        public Guid DoctorId { get; set; }
        public Guid LocationId { get; set; }
        public DateOnly SlotDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; } = true;
        public bool IsBlocked { get; set; } = false;
        public string? BlockReason { get; set; }
        public Guid? ServiceId { get; set; }
        public MedicalService? Service { get; set; }

        // Relatii
        public Doctor Doctor { get; set; } = null!;
        public Location Location { get; set; } = null!;
        
    }
}
