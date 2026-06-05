export const getCookieConsent = (): 'accepted' | 'declined' | null => {
  return localStorage.getItem('cookieConsent') as 'accepted' | 'declined' | null;
};

export const hasConsent = (): boolean => {
  return localStorage.getItem('cookieConsent') === 'accepted';
};

export const savePreference = (key: string, value: string) => {
  if (hasConsent()) {
    localStorage.setItem(key, value);
  }
};

export const getPreference = (key: string): string | null => {
  if (hasConsent()) {
    return localStorage.getItem(key);
  }
  return null;
};