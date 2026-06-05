import api from './authApi';

export interface ReviewDto {
  id: string;
  patientName: string;
  doctorName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewDto {
  appointmentId: string;
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  getDoctorReviews: (doctorId: string) =>
    api.get<ReviewDto[]>(`/reviews/doctor/${doctorId}`),

  createReview: (dto: CreateReviewDto) =>
    api.post<ReviewDto>('/reviews', dto),

  getTopReviews: (count = 6) =>
    api.get<ReviewDto[]>(`/reviews/top?count=${count}`),

  getAverageRating: () =>
    api.get<number>(`/reviews/average`),
};