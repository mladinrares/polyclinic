import axios from 'axios';
import type { AuthResponse, LoginDto, RegisterDto } from '../types/auth';

const API_URL = 'http://localhost:5289/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor - adauga automat token-ul la fiecare request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor - daca primim 401, incercam refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, JSON.stringify(refreshToken), {
            headers: { 'Content-Type': 'application/json' }
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (dto: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', dto),

  login: (dto: LoginDto) =>
    api.post<AuthResponse>('/auth/login', dto),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', refreshToken),

  revoke: (refreshToken: string) =>
    api.post('/auth/revoke', refreshToken),

  getMe: () =>
    api.get('/user/me'),

  verifyEmail: (token: string) =>
      api.get(`/auth/verify-email`, {params: {token}}),

  resendVerification: () =>
    api.post('/auth/resend-verification'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export default api;