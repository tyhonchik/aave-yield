import { describe, expect, it } from 'vitest';
import { AppError, createErrorResponse, isAppError } from '../error';

describe('AppError', () => {
  it('should create retryable errors for network and server types', () => {
    const networkError = AppError.network('Connection failed');
    expect(networkError.retryable).toBe(true);
    expect(networkError.type).toBe('network');
    expect(networkError.userMessage).toContain('Connection problem');

    const serverError = AppError.server('Internal server error');
    expect(serverError.retryable).toBe(true);
    expect(serverError.type).toBe('server');
    expect(serverError.userMessage).toContain('Server error');
  });

  it('should create non-retryable errors for validation and client types', () => {
    const validationError = AppError.validation('Invalid input');
    expect(validationError.retryable).toBe(false);
    expect(validationError.type).toBe('validation');

    const clientError = AppError.client('Unauthorized');
    expect(clientError.retryable).toBe(false);
    expect(clientError.type).toBe('client');
  });

  it('should correctly identify AppError instances', () => {
    const appError = AppError.network('Test');
    const regularError = new Error('Regular error');
    const notAnError = { message: 'Not an error' };

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(regularError)).toBe(false);
    expect(isAppError(notAnError)).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it('should convert unknown errors correctly for real-world scenarios', () => {
    // Network error simulation
    const fetchError = new Error('fetch failed');
    fetchError.cause = new Error('ECONNREFUSED');
    const networkAppError = AppError.fromUnknown(fetchError);
    expect(networkAppError.type).toBe('network');
    expect(networkAppError.retryable).toBe(true);

    // String error - fromUnknown converts strings to server errors with default message
    const stringError = 'Something went wrong';
    const serverAppError = AppError.fromUnknown(stringError);
    expect(serverAppError.type).toBe('server');
    expect(serverAppError.message).toBe('An unexpected error occurred'); // Default message for non-Error types

    // Already an AppError
    const existingAppError = AppError.validation('Already processed');
    const sameError = AppError.fromUnknown(existingAppError);
    expect(sameError).toBe(existingAppError);
  });
});

describe('createErrorResponse', () => {
  it('should create correct HTTP status codes for different error types', () => {
    const networkError = AppError.network('Network failed');
    const { response: networkResponse, status: networkStatus } = createErrorResponse(networkError);
    expect(networkStatus).toBe(503); // Service Unavailable
    expect(networkResponse.retryable).toBe(true);

    const validationError = AppError.validation('Invalid data');
    const { response: validationResponse, status: validationStatus } =
      createErrorResponse(validationError);
    expect(validationStatus).toBe(400); // Bad Request
    expect(validationResponse.retryable).toBe(false);

    const clientError = AppError.client('Unauthorized');
    const { response: clientResponse, status: clientStatus } = createErrorResponse(clientError);
    expect(clientStatus).toBe(403); // Default for client errors is 403, not 401
    expect(clientResponse.retryable).toBe(false);

    const serverError = AppError.server('Internal error');
    const { response: serverResponse, status: serverStatus } = createErrorResponse(serverError);
    expect(serverStatus).toBe(500); // Internal Server Error
    expect(serverResponse.retryable).toBe(true);
  });

  it('should handle unknown errors with 500 status', () => {
    const unknownError = new Error('Unknown error');
    const { response, status } = createErrorResponse(unknownError);

    expect(status).toBe(500);
    expect(response.type).toBe('server');
    expect(response.retryable).toBe(true);
    expect(response.error).toBe('Server error. Please try again in a moment.'); // This is the userMessage, not the original message
  });

  it('should preserve original status codes when available', () => {
    const clientErrorWithStatus = AppError.client('Forbidden', 'Access denied', 403);
    const { status } = createErrorResponse(clientErrorWithStatus);
    expect(status).toBe(403);
  });
});
