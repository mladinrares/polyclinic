export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}

export interface User {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}