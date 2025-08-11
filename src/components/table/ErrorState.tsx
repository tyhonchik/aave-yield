'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppError, isAppError } from '@/lib/error';

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ error, message, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  const appError = error
    ? isAppError(error)
      ? error
      : AppError.fromUnknown(error)
    : AppError.server(message || 'An unexpected error occurred');

  return (
    <Card className="p-6 md:p-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
        </div>

        <div className="space-y-2">
          <div className="text-base md:text-lg font-medium text-destructive">
            {appError.userMessage}
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground font-mono break-words">
              {appError.type} error: {appError.message}
            </div>
          )}
        </div>

        {appError.retryable && onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-4 w-full sm:w-auto">
            {retryLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
