import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateInput(dateStr: string | Date): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    return axiosError.response?.data?.error ?? 'حدث خطأ غير متوقع';
  }
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}
