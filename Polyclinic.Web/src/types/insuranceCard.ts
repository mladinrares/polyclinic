export interface InsuranceCardDto {
  id: string;
  firstName: string;
  lastName: string;
  insuredCode: string;
  documentNumber: string;
  expiryDate: string;
  isActive: boolean;
  isValid: boolean;
  isVerified: boolean;
}

export interface AddInsuranceCardDto {
  firstName: string;
  lastName: string;
  insuredCode: string;
  documentNumber: string;
  expiryDate: string;
}

export interface PatientInsuranceDto {
  patientId: string;
  patientName: string;
  patientEmail: string;
  cardId: string;
  firstName: string;
  lastName: string;
  insuredCode: string;
  documentNumber: string;
  expiryDate: string;
  isVerified: boolean;
  isValid: boolean;
}