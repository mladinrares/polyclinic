using Polyclinic.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? appointmentId = null);
        Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
    }
}
