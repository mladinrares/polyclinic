import { create } from 'zustand';
import type { AuthResponse, User } from '../types/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (response: AuthResponse) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setEmailVerified: () => void;
}


function getUserFromToken(): User | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const decoded: any = jwtDecode(token);
    return {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role ?? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? '',
      firstName: decoded.firstName ?? '',
      lastName: decoded.lastName ?? '',
      emailVerified: decoded.emailVerified === 'true',
    };
  } catch {
    return null;
  }
}

const token = localStorage.getItem('accessToken');

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromToken(),
  isAuthenticated: !!token,
  isLoading: false,

  setAuth: (response: AuthResponse) => {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    set({
      user: {
        userId: response.userId,
        email: response.email,
        role: response.role,
        firstName: response.firstName,
        lastName: response.lastName,
        emailVerified: response.emailVerified,
      },
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setEmailVerified: () => set(state => ({
    user: state.user ? { ...state.user, emailVerified: true } : null
  })),
}));