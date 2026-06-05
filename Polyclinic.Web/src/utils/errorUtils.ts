import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback = 'A apărut o eroare'): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}