export interface TimeSlotDto {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateAppointmentDto {
  doctorId: string;
  serviceId: string;
  locationId: string;
  timeSlotId: string;
  reason?: string;
  type: string;
}

export interface AppointmentDto {
  id: string;
  doctorName: string;
  specialtyName: string;
  serviceName: string;
  locationName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  pricePaid: number;
  paymentStatus: string;
  createdAt: string;
  hasReview?: boolean;
}

export interface WaitingListEntryDto {
  id: string;
  doctorName: string;
  serviceName: string;
  locationName: string;
  preferredDateFrom: string;
  preferredDateTo: string;
  preferredTimeOfDay?: string;
  status: string;
  notifiedAt?: string;
  createdAt: string;
}