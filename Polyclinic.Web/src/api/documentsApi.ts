import type { DocumentDto } from '../types/document';
import api from './authApi';

export const documentsApi = {
  getMyDocuments: () => api.get<DocumentDto[]>('/documents'),

  uploadDocument: (file: File, type: string, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('name', name);
    return api.post<{ id: string; name: string; fileUrl: string }>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
};