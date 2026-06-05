using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);
        Task SendEmailVerificationAsync(string to, string firstName, string token);
        Task SendAppointmentReminderAsync(string to, string firstName, string doctorName, string serviceName, string date, string time);
        Task SendWaitingListNotificationAsync(string to, string firstName, string doctorName, string serviceName, string date, string time);
        Task SendAppointmentConfirmationAsync(string to, string firstName, string doctorName, string serviceName, string date, string time, string locationName);
        Task SendAppointmentCancellationAsync(string to, string firstName, string doctorName, string serviceName, string date, string time, string reason);
        Task SendWalkInPasswordEmailAsync(string to, string firstName, string password);
        Task SendWalkInMigrationEmailAsync(string to, string firstName, string verifyUrl);
        Task SendPasswordResetEmailAsync(string to, string firstName, string resetUrl);
    }
}
