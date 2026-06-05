import api from './authApi';
import type { DoctorAppointmentDto } from '../types/medical';
import type { PagedResult } from '../types/doctor';
import type { CreatePatientDto, PatientDto, UpdatePatientDto } from '../types/patients';

export const receptionApi = {
  getTodayAppointments: (params: {
    date?: string;
    locationId?: string;
    searchName?: string;
    fromTime?: string;
    toTime?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    doctorId?: string;
    specialtyId?: string;
}) => api.get<PagedResult<DoctorAppointmentDto>>('/reception/appointments', { params }),

  checkIn: (id: string) =>
    api.post(`/reception/appointments/${id}/checkin`),

  processPayment: (id: string, paymentMethod: string) =>
    api.post(`/reception/appointments/${id}/payment`, JSON.stringify(paymentMethod), {
      headers: { 'Content-Type': 'application/json' }
    }),
    createAppointmentForPatient: (dto: {
        patientEmail?: string;
        walkinPatientId?: string;
        doctorId: string;
        serviceId: string;
        locationId: string;
        timeSlotId: string;
        reason?: string;
    }) => api.post('/reception/appointments', dto),
    getPendingReferrals: (page = 1, pageSize = 20) =>
    api.get<PagedResult<DoctorAppointmentDto>>('/reception/pending-referrals', {
      params: { page, pageSize }
    }),
    getAvailableDoctorsForDate: (date: string) =>
    api.get<{ doctorIds: string[]; specialtyIds: string[] }>('/reception/available-filters', {
      params: { date }
    }),
    getPatientByEmail: (email: string) =>
      api.get<{ firstName: string; lastName: string; email: string; emailVerified: boolean }>(`/reception/patient-by-email`, { params: { email } }),

    getPatients: (search?: string, page = 1, pageSize = 20, showInactive = false) =>
      api.get<PagedResult<PatientDto>>('/reception/patients', { params: { search, page, pageSize, showInactive } }),

      createPatient: (dto: CreatePatientDto) =>
        api.post<PatientDto>('/reception/patients', dto),

      updatePatient: (id: string, dto: UpdatePatientDto) =>
        api.put(`/reception/patients/${id}`, dto),

      deactivatePatient: (id: string) =>
        api.post(`/reception/patients/${id}/deactivate`),

      reactivatePatient: (id: string) =>
        api.post(`/reception/patients/${id}/reactivate`),

      resendVerification: (id: string) =>
        api.post(`/reception/patients/${id}/resend-verification`),
};