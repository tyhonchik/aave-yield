/**
 * Toast Notification System
 */

import { toast } from 'sonner';
import { AppError, isAppError } from './error';

export function showErrorNotification(error: unknown): void {
  const appError = isAppError(error) ? error : AppError.fromUnknown(error);

  toast.error(appError.userMessage, {
    duration: 5000,
  });
}

export function showSuccessNotification(message: string): void {
  toast.success(message, {
    duration: 3000,
  });
}

export function showInfoNotification(message: string): void {
  toast.info(message, {
    duration: 4000,
  });
}

/**
 * Notify if query failed completely and no cached data
 */
export function shouldNotifyError(error: unknown, hasData: boolean): boolean {
  if (isAppError(error)) {
    if (error.type === 'validation' || error.type === 'client') {
      return true;
    }
  }

  // For network/server errors, only show if we have no data
  return !hasData;
}

export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(prefix, error);
  }
}
