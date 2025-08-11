import { AppError } from './error';

/**
 * Fetch with error handling
 */
export async function apiRequestJSON<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    throw AppError.network();
  }

  if (!response.ok) {
    let errorData: { error?: string; message?: string } | undefined;
    try {
      errorData = await response.json();
    } catch {}

    const message =
      errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`;

    const errorWithStatus = new Error(message);
    throw AppError.fromUnknown(errorWithStatus);
  }

  try {
    return await response.json();
  } catch {
    throw AppError.server('Invalid response format');
  }
}

/**
 * Retry logic for React Query
 */
export function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  // Don't retry more than 2 times
  if (failureCount >= 2) return false;

  return AppError.fromUnknown(error).retryable;
}
