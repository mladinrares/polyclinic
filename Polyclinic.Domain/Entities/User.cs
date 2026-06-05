namespace Polyclinic.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } 
        public string PasswordHash { get; set; }
        public string? TemporaryPassword { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public string? GoogleId { get; set; }
        public string? FacebookId { get; set; }
        public string Phone { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? CNP { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? County { get; set; }
        public string? ProfilePictureUrl { get; set; }  
        public bool IsActive { get; set; } = true;
        public bool EmailVerified { get; set; } = false;
        public string Role { get; set; } = "patient";
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }

        // relatii
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        public ICollection<InsuranceCard> InsuranceCards { get; set; } = new List<InsuranceCard>();
        public ICollection<PatientConsent> PatientConsents { get; set; } = new List<PatientConsent>();
        public ICollection<WaitingList> WaitingList { get; set; } = new List<WaitingList>();
    }
}
