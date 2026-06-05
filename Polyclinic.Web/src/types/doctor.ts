export interface DoctorDto {
  id: string;
  firstName: string;
  lastName: string;
  specialtyName: string;
  specialtyId?: string;
  bio?: string;
  experienceYears: number;
  consultationFee: number;
  profilePictureUrl?: string;
  averageRating: number;
  reviewCount: number;
  isAvailable: boolean;
  locationIds?: string[];
  licenseNumber?: string;
}

export interface DoctorFilterDto {
  searchName?: string;
  specialtyId?: string;
  locationId?: string;
  maxFee?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MedicalServiceDto {
  id: string;
  name: string;
  isBookableOnline?: boolean;
  durationMinutes: number;
  price: number;
  requiresReferral: boolean;
  specialtyId?: string;
  specialtyName?: string;
  isActive?: boolean;
  isCNASCovered?: boolean;
  cnasCoveredAmount?: number;
}

export interface SpecialtyDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  doctorCount: number;
}

export interface LocationDto {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  phone?: string;
  isActive: boolean;
}

export interface UpdateDoctorDto {
  firstName: string;
  lastName: string;
  specialtyId: string;
  bio?: string;
  experienceYears?: number;
  consultationFee?: number;
  licenseNumber?: string;
}

export interface DoctorCalendarDay {
  date: string;
  totalSlots: number;
  availableSlots: number;
  hasAvailable: boolean;
}

