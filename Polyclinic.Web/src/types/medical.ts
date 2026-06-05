export interface MedicalRecordDto {
  id: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  anamnesis?: string;
  examinationNotes?: string;
  treatmentPlan?: string;
  recommendations?: string;
  recordDate: string;
  prescriptions: PrescriptionDto[];
  investigations: InvestigationDto[];
}

export interface PrescriptionDto {
  id: string;
  prescriptionNumber: string;
  validFrom: string;
  validUntil: string;
  status: string;
  items: PrescriptionItemDto[];
}

export interface PrescriptionItemDto {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

export interface InvestigationDto {
  id: string;
  type: string;
  name: string;
  status: string;
  notes?: string;
  requestedAt: string;
  completedAt?: string;
  resultUrl?: string;
}

export interface DoctorAppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  serviceName: string;
  locationName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
  pricePaid: number;
  checkedInAt?: string;
  paymentStatus: string;
  hasMedicalRecord: boolean;
  externalReferralUrl?: string;
  doctorName: string;
  specialtyName: string;
  isWalkIn?: boolean;
}

export interface MedicalRecordFormData {
  diagnosis: string;
  anamnesis: string;
  examinationNotes: string;
  treatmentPlan: string;
  recommendations: string;
  prescriptionItems: {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
  }[];
  investigations: {
    type: string;
    name: string;
    notes: string;
  }[];
}