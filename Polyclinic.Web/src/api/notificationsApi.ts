import api from './authApi';
import type { NotificationDto } from '../types/notification.ts';

export const notificationsApi = {
  getNotifications: () => api.get<NotificationDto[]>('/notifications'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};