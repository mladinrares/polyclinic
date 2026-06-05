import api from '../api/authApi';
import { hasConsent } from './cookieConsent';

type AnalyticsEvent =
  | 'page_view'
  | 'search'
  | 'book_appointment'
  | 'view_doctor'
  | 'filter_specialty'
  | 'login'
  | 'register';

export const trackEvent = async (
  event: AnalyticsEvent,
  page?: string,
  data?: Record<string, string>
) => {
  if (!hasConsent()) return;
  try {
    await api.post('/analytics/track', { event, page, data });
  } catch {
    // silently fail
  }
};

export const getAnalytics = () => {
  if (!hasConsent()) return [];
  return JSON.parse(localStorage.getItem('analytics_events') ?? '[]');
};