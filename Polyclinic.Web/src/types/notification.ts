export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  appointmentId?: string;
  createdAt: string;
}