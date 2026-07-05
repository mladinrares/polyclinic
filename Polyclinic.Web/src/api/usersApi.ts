import type { PagedResult } from "../types/doctor";
import type { AddInsuranceCardDto, InsuranceCardDto, PatientInsuranceDto } from "../types/insuranceCard";
import api from "./authApi";

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  dateOfBirth?: string;
  gender?: string;
  role: string;
  emailVerified: boolean;
  profilePictureUrl?: string;
  cnp?: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getProfile: () => api.get<UserProfileDto>('/users/profile'),
  updateProfile: (dto: UpdateProfileDto) => api.put<UserProfileDto>('/users/profile', dto),
  changePassword: (dto: ChangePasswordDto) => api.post('/users/change-password', dto),
  getInsuranceCards: () => api.get<InsuranceCardDto[]>('/users/insurance-cards'),
  addInsuranceCard: (dto: AddInsuranceCardDto) => api.post<InsuranceCardDto>('/users/insurance-cards', dto),
  removeInsuranceCard: (id: string) => api.delete(`/users/insurance-cards/${id}`),
  getValidInsuranceCard: () => api.get<InsuranceCardDto | null>('/users/insurance-cards/valid'),
  getPatientsWithCards: (searchName?: string, page = 1, pageSize = 20) =>
    api.get<PagedResult<PatientInsuranceDto>>('/users/insurance-cards/all', {
      params: { searchName, page, pageSize }
    }),

  validateInsuranceCard: (id: string) =>
    api.post(`/users/insurance-cards/${id}/validate`),

  invalidateInsuranceCard: (id: string) =>
    api.post(`/users/insurance-cards/${id}/invalidate`),

  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ profilePictureUrl: string }>('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteOwnAccount: () => api.delete('/users/me'),
};