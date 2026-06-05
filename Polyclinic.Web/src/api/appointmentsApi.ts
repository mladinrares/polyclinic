import api from './authApi';
import type { AppointmentDto, CreateAppointmentDto, TimeSlotDto, WaitingListEntryDto } from '../types/appointment';
import type { DoctorCalendarDay, PagedResult } from '../types/doctor';

export const appointmentsApi = {
  getAvailableSlots: (doctorId: string, locationId: string, date: string, serviceId?: string) =>
    api.get<TimeSlotDto[]>('/appointments/slots', {
      params: { doctorId, locationId, date, serviceId }
   }),

  createAppointment: (dto: CreateAppointmentDto) =>
    api.post<AppointmentDto>('/appointments', dto),

  getMyAppointments: (page = 1, pageSize = 10) =>
    api.get<PagedResult<AppointmentDto>>('/appointments/my', {
      params: { page, pageSize }
    }),

  cancelAppointment: (id: string, reason: string) =>
    api.post(`/appointments/${id}/cancel`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    }),

  getFirstAvailableDate: (doctorId: string, locationId: string, serviceId?: string, afterDate?: string) =>
  api.get<{ date: string | null; hasAnySlots: boolean }>('/appointments/first-available', {
    params: { doctorId, locationId, serviceId, afterDate }
  }),
  
  getAvailableLocations: (doctorId: string, serviceId: string) =>
    api.get<string[]>('/appointments/available-locations', {
      params: { doctorId, serviceId }
    }),

  uploadExternalReferral: (appointmentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/appointments/${appointmentId}/upload-referral`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  approveExternalReferral: (appointmentId: string) =>
    api.post(`/appointments/${appointmentId}/approve-referral`),

  rejectExternalReferral: (appointmentId: string, reason: string) =>
    api.post(`/appointments/${appointmentId}/reject-referral`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    }),

  addToWaitingList: (dto: {
    doctorId: string;
    serviceId: string;
    locationId: string;
    preferredDateFrom: string;
    preferredDateTo: string;
    preferredTimeOfDay?: string;
  }) => api.post('/appointments/waiting-list', dto),

  getMyWaitingList: () =>
    api.get<WaitingListEntryDto[]>('/appointments/waiting-list'),

  removeFromWaitingList: (id: string) =>
    api.delete(`/appointments/waiting-list/${id}`),

  getLocationsByService: (doctorId: string, serviceId: string) =>
    api.get<string[]>(`/appointments/locations-by-service/${doctorId}`, { params: { serviceId } }),

  getDoctorCalendar: (doctorId: string, locationId: string, serviceId?: string) =>
    api.get<DoctorCalendarDay[]>(`/appointments/calendar/${doctorId}`, {
      params: { locationId, serviceId }
    }),
};