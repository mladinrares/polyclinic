
export interface PatientDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  cnp?: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  cnp?: string;
}

export interface UpdatePatientDto {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  county?: string;
  cnp?: string;
}