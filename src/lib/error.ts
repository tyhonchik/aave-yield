export type ErrorType = 'network' | 'validation' | 'client' | 'server';

type ApiErrorResponse = {
  error: string;
  type: ErrorType;
  retryable: boolean;
  details: string;
};

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly originalStatus?: number;

  constructor(message: string, type: ErrorType, userMessage?: string, originalStatus?: number) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.retryable = type === 'network' || type === 'server'; // Only retry network and server errors
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.originalStatus = originalStatus;
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case 'network':
        return 'Connection problem. Please check your internet and try again.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'client':
        return 'Access denied. Please check your permissions or configuration.';
      case 'server':
        return 'Server error. Please try again in a moment.';
    }
  }

  // Factory methods for common cases
  static network(message?: string): AppError {
    return new AppError(message || 'Network request failed', 'network');
  }

  static validation(message: string, userMessage?: string): AppError {
    return new AppError(message, 'validation', userMessage);
  }

  static client(message?: string, userMessage?: string, originalStatus?: number): AppError {
    return new AppError(message || 'Client error occurred', 'client', userMessage, originalStatus);
  }

  static server(message?: string): AppError {
    return new AppError(message || 'Server error occurred', 'server');
  }

  // Convert any error to AppError
  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const originalMessage = error.message;

      if (this.isNetworkError(message)) {
        return AppError.network(originalMessage);
      }

      const statusMatch = message.match(/(?:status|http)\s*:?\s*(\d{3})/);
      if (statusMatch) {
        const statusCode = parseInt(statusMatch[1], 10);

        if (statusCode >= 400 && statusCode < 500) {
          if (statusCode === 400) {
            return AppError.validation(originalMessage);
          } else {
            const userMessage =
              statusCode === 401
                ? 'Authentication required. Please connect your wallet.'
                : statusCode === 403
                  ? 'Access denied. Check your API key or permissions.'
                  : statusCode === 404
                    ? 'Resource not found. Please try again later.'
                    : 'Client error. Please check your request and try again.';

            return AppError.client(originalMessage, userMessage, statusCode);
          }
        } else if (statusCode >= 500) {
          return AppError.server(originalMessage);
        }
      }

      if (this.isValidationError(message)) {
        return AppError.validation(originalMessage);
      }

      if (this.isClientError(message)) {
        return AppError.client(originalMessage);
      }

      if (this.isRpcError(message)) {
        if (message.includes('403') || message.includes('401')) {
          const statusCode = message.includes('403') ? 403 : 401;
          return AppError.client(
            originalMessage,
            'RPC access denied. Check your API key.',
            statusCode,
          );
        } else if (message.includes('429') || message.includes('rate limit')) {
          return new AppError(
            originalMessage,
            'server',
            'Too many requests. Please wait and try again.',
          );
        } else {
          return AppError.server(originalMessage);
        }
      }

      // Default to server error
      return AppError.server(originalMessage);
    }

    // Fallback for unknown error types
    return AppError.server('An unexpected error occurred');
  }

  // Convert to API response format
  toJSON() {
    return {
      error: this.userMessage,
      type: this.type,
      retryable: this.retryable,
      details: this.message,
    };
  }

  private static isNetworkError(message: string): boolean {
    return (
      message.includes('fetch failed') ||
      message.includes('network error') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused')
    );
  }

  private static isValidationError(message: string): boolean {
    return (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('missing')
    );
  }

  private static isClientError(message: string): boolean {
    return (
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('access denied') ||
      message.includes('auth') ||
      message.includes('permission')
    );
  }

  private static isRpcError(message: string): boolean {
    return (
      message.includes('rpc') ||
      message.includes('viem') ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    );
  }

  private static isServerError(message: string): boolean {
    return message.includes('server error') || message.includes('internal server error');
  }
}

// Type guard
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// For React Query retry logic
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false; // Max 2 retries

  if (isAppError(error)) {
    return error.retryable;
  }

  return true;
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(error: unknown, status?: number) {
  const appError = AppError.fromUnknown(error);

  // Use original status if available, otherwise fall back to defaults
  let finalStatus: number;
  if (status) {
    finalStatus = status;
  } else if (appError.originalStatus) {
    finalStatus = appError.originalStatus;
  } else {
    // Default status based on error type
    switch (appError.type) {
      case 'validation':
        finalStatus = 400;
        break;
      case 'client':
        finalStatus = 403;
        break;
      case 'network':
        finalStatus = 503;
        break;
      default:
        finalStatus = 500;
    }
  }

  return {
    response: appError.toJSON(),
    status: finalStatus,
  };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  message: string,
  userMessage?: string,
): { response: ApiErrorResponse; status: number } {
  const appError = AppError.validation(message, userMessage);

  return {
    response: appError.toJSON(),
    status: 400,
  };
}
