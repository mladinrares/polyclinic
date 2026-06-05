import api from './authApi';
import type { MedicalRecordDto, MedicalRecordFormData, DoctorAppointmentDto } from '../types/medical';

export const medicalRecordsApi = {
  createMedicalRecord: (appointmentId: string, data: MedicalRecordFormData) =>
    api.post<MedicalRecordDto>('/medicalrecords', {
      appointmentId,
      diagnosis: data.diagnosis,
      anamnesis: data.anamnesis,
      examinationNotes: data.examinationNotes,
      treatmentPlan: data.treatmentPlan,
      recommendations: data.recommendations,
      prescriptionItems: data.prescriptionItems,
      investigations: data.investigations,
    }),

  getByAppointment: (appointmentId: string) =>
    api.get<MedicalRecordDto>(`/medicalrecords/appointment/${appointmentId}`),

  getMyHistory: () =>
    api.get<MedicalRecordDto[]>('/medicalrecords/my-history'),

  getPatientHistoryForDoctor: (patientId: string) =>
    api.get<MedicalRecordDto[]>(`/medicalrecords/patient/${patientId}`),

  downloadPdf: (appointmentId: string) =>
    api.get(`/medicalrecords/${appointmentId}/pdf`, { responseType: 'blob' }),

  uploadInvestigationResult: (investigationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/appointments/investigations/${investigationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  completeInvestigation: (investigationId: string) =>
    api.post(`/appointments/investigations/${investigationId}/complete`),
};

export const doctorAppointmentsApi = {
  getDoctorAppointments: (date?: string) =>
    api.get<DoctorAppointmentDto[]>('/appointments/doctor', { params: { date } }),

  completeAppointment: (id: string) =>
    api.post(`/appointments/${id}/complete`),
};