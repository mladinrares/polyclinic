import api from './authApi';

export interface WalkInPatientDto {
  id: string;
  firstName: string;
  lastName: string;
  cnp: string;
  phone: string;
  email?: string;
  age?: number;
  address?: string;
  city?: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateWalkInPatientDto {
  firstName: string;
  lastName: string;
  cnp: string;
  phone: string;
  email?: string;
  age?: number;
  address?: string;
  city?: string;
}

export const walkInApi = {
  getAll: (search?: string, page = 1, pageSize = 20, showInactive = false) =>
    api.get<{ items: WalkInPatientDto[]; totalCount: number; totalPages: number }>('/walkin-patients', {
      params: { search, page, pageSize, showInactive }
    }),

  getByCNP: (cnp: string) =>
    api.get<WalkInPatientDto>(`/walkin-patients/by-cnp/${cnp}`),

  create: (dto: CreateWalkInPatientDto) =>
    api.post<WalkInPatientDto>('/walkin-patients', dto),

  update: (id: string, dto: CreateWalkInPatientDto) =>
    api.put<WalkInPatientDto>(`/walkin-patients/${id}`, dto),

  migrate: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/walkin-patients/${id}/migrate`),

  deactivate: (id: string) =>
    api.post(`/walkin-patients/${id}/deactivate`),

  reactivate: (id: string) =>
    api.post(`/walkin-patients/${id}/reactivate`),

  
};