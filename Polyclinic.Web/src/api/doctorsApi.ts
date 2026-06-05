import api from './authApi';
import type { DoctorDto, DoctorFilterDto, LocationDto, MedicalServiceDto, PagedResult, SpecialtyDto } from '../types/doctor';

export const doctorsApi = {
  getDoctors: (filter?: DoctorFilterDto) =>
    api.get<PagedResult<DoctorDto>>('/doctors', { params: filter }),

  getDoctorById: (id: string) =>
    api.get<DoctorDto>(`/doctors/${id}`),

  getDoctorServices: (id: string) =>
    api.get<MedicalServiceDto[]>(`/doctors/${id}/services`),
  
  getSpecialties: () => api.get<SpecialtyDto[]>('/doctors/specialties'),

  getLocations: () => api.get<LocationDto[]>('/doctors/locations'),

  getAllDoctorServices: (id: string) =>
    api.get<MedicalServiceDto[]>(`/doctors/${id}/all-services`),

  getDoctorServicesByLocation: (doctorId: string, locationId: string) =>
    api.get<MedicalServiceDto[]>(`/doctors/${doctorId}/services/location/${locationId}`),
  
  getServicesBySpecialty: (specialtyId: string) =>
    api.get<MedicalServiceDto[]>(`/doctors/specialties/${specialtyId}/services`),

  getCNASServices: () =>
    api.get<MedicalServiceDto[]>('/doctors/services/cnas'),

  getPublicStats: () =>
    api.get<{ totalAppointments: number; totalDoctors: number }>('/doctors/stats/public'),
};

