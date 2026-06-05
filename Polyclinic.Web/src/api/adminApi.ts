import api from './authApi';
import type { DoctorDto, SpecialtyDto, LocationDto, MedicalServiceDto, PagedResult, UpdateDoctorDto } from '../types/doctor';
import type { AuditLogDto } from '../types/audit';

export interface AdminStatsDto {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  appointmentsToday: number;
  appointmentsThisMonth: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  revenueThisMonth: number;
  appointmentsByDay: { day: string; count: number }[];
}

export interface CreateDoctorDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specialtyId: string;
  licenseNumber: string;
  bio?: string;
  experienceYears: number;
  consultationFee: number;
}

export interface CreateSpecialtyDto {
  name: string;
  description?: string;
}

export interface CreateLocationDto {
  name: string;
  address: string;
  city: string;
  county: string;
  phone?: string;
  email?: string;
}

export interface CreateMedicalServiceDto {
  specialtyId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  requiresReferral: boolean;
  isBookableOnline: boolean;
  isCNASCovered: boolean;
  cnasCoveredAmount?: number;
}

export interface DoctorScheduleDto {
  id: string;
  doctorName: string;
  locationName: string;
  serviceName?: string;
  workingDays: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface CreateDoctorScheduleDto {
  doctorId: string;
  locationId: string;
  serviceId?: string;
  workingDays: string[];
  startTime: string;
  endTime: string;
}

export interface MonthlyStatsDto {
  month: string;
  appointments: number;
  revenue: number;
  cancellations: number;
}

export interface AnalyticsSummaryDto {
  totalEvents: number;
  uniqueUsers: number;
  topEvents: { name: string; count: number }[];
  topPages: { name: string; count: number }[];
  topSearches: { name: string; count: number }[];
  topSpecialties: { name: string; count: number }[];
  dailyEvents: { date: string; count: number }[];
}

export interface SlotTimeDto {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  hasAppointment: boolean;
  patientName?: string;
  locationName?: string;
}

export interface SlotsByDateDto {
  date: string;
  slots: SlotTimeDto[];
}

export const adminApi = {
  getStats: () => api.get<AdminStatsDto>('/admin/stats'),

  // Doctori
  createDoctor: (dto: CreateDoctorDto) => api.post<DoctorDto>('/admin/doctors', dto),
  updateDoctor: (id: string, dto: Partial<UpdateDoctorDto>) => api.put<DoctorDto>(`/admin/doctors/${id}`, dto),
  deleteDoctor: (id: string) => api.delete(`/admin/doctors/${id}`),
  getAllDoctors: (includeInactive = false) => 
    api.get<DoctorDto[]>(`/admin/doctors?includeInactive=${includeInactive}`),

  // Specialitati
  getSpecialties: (includeInactive = false) => 
    api.get<SpecialtyDto[]>(`/admin/specialties?includeInactive=${includeInactive}`),
  createSpecialty: (dto: CreateSpecialtyDto) => api.post<SpecialtyDto>('/admin/specialties', dto),
  deleteSpecialty: (id: string) => api.delete(`/admin/specialties/${id}`),

  // Locatii
  getLocations: (includeInactive = false) => 
    api.get<LocationDto[]>(`/admin/locations?includeInactive=${includeInactive}`),
  createLocation: (dto: CreateLocationDto) => api.post<LocationDto>('/admin/locations', dto),
  deleteLocation: (id: string) => api.delete(`/admin/locations/${id}`),

  getServices: (includeInactive = false) => 
    api.get<MedicalServiceDto[]>(`/admin/services?includeInactive=${includeInactive}`),
  createService: (dto: CreateMedicalServiceDto) => api.post<MedicalServiceDto>('/admin/services', dto),
  deleteService: (id: string) => api.delete(`/admin/services/${id}`),

  addServiceToDoctor: (doctorId: string, serviceId: string) =>
    api.post(`/admin/doctors/${doctorId}/services/${serviceId}`),

  removeServiceFromDoctor: (doctorId: string, serviceId: string) =>
    api.delete(`/admin/doctors/${doctorId}/services/${serviceId}`),

  getDoctorSchedules: (doctorId: string) =>
    api.get<DoctorScheduleDto[]>(`/admin/doctors/${doctorId}/schedules`),

  createDoctorSchedule: (dto: CreateDoctorScheduleDto) =>
    api.post<DoctorScheduleDto>('/admin/doctors/schedules', dto),

  deleteDoctorSchedule: (id: string) =>
    api.delete(`/admin/doctors/schedules/${id}`),

  generateSlots: (doctorId: string, daysAhead = 30) =>
    api.post(`/admin/doctors/${doctorId}/generate-slots?daysAhead=${daysAhead}`),

  reactivateDoctor: (id: string) => api.post(`/admin/doctors/${id}/reactivate`),
  reactivateSpecialty: (id: string) => api.post(`/admin/specialties/${id}/reactivate`),
  reactivateLocation: (id: string) => api.post(`/admin/locations/${id}/reactivate`),
  reactivateService: (id: string) => api.post(`/admin/services/${id}/reactivate`),

  getAuditLogs: (params: {
    userEmail?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<PagedResult<AuditLogDto>>('/admin/audit-logs', { params }),

  updateService: (id: string, dto: CreateMedicalServiceDto) =>
    api.put<MedicalServiceDto>(`/admin/services/${id}`, dto),

  updateSpecialty: (id: string, dto: CreateSpecialtyDto) =>
    api.put<SpecialtyDto>(`/admin/specialties/${id}`, dto),

  updateLocation: (id: string, dto: CreateLocationDto) =>
    api.put<LocationDto>(`/admin/locations/${id}`, dto),

  getMonthlyStats: () => api.get<MonthlyStatsDto[]>('/admin/stats/monthly'),

  getAnalyticsSummary: () => api.get<AnalyticsSummaryDto>('/analytics/summary'),

  generateSlotsCustom: (doctorId: string, days: number) =>
    api.post(`/admin/doctors/${doctorId}/generate-slots`, { days }),

  getSlotCalendar: (doctorId: string) =>
    api.get<SlotsByDateDto[]>(`/admin/doctors/${doctorId}/slots/calendar`),

  deleteSlotsByDate: (doctorId: string, date: string, reason: string) =>
    api.delete(`/admin/doctors/${doctorId}/slots/date`, { params: { date, reason } }),

  deleteSlotsByTime: (doctorId: string, date: string, time: string, reason: string) =>
    api.delete(`/admin/doctors/${doctorId}/slots/time`, { params: { date, time, reason } }),
};