import api from './authApi';

export interface ReferralDto {
  id: string;
  referralNumber: string;
  patientName: string;
  referringDoctorName: string;
  specialtyName: string;
  serviceName: string;
  reason: string;
  notes?: string;
  validFrom: string;
  validUntil: string;
  status: string;
  createdAt: string;
}

export interface CreateReferralDto {
  patientId: string;
  specialtyId: string;
  serviceId: string;
  reason: string;
  notes?: string;
  validDays: number;
}

export const referralsApi = {
  createReferral: (dto: CreateReferralDto) =>
    api.post<ReferralDto>('/referrals', dto),

  getMyReferrals: () =>
    api.get<ReferralDto[]>('/referrals/my'),

  getIssuedReferrals: () =>
    api.get<ReferralDto[]>('/referrals/issued'),

  getValidReferral: (serviceId: string) =>
    api.get<{ hasReferral: boolean; referral?: ReferralDto }>('/referrals/valid', {
      params: { serviceId }
    }),

  downloadPdf: (id: string) =>
    api.get(`/referrals/${id}/pdf`, { responseType: 'blob' }),
};