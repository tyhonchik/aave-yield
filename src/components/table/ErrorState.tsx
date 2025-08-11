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
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>

        <div className="space-y-2">
          <div className="text-lg font-medium text-destructive">{appError.userMessage}</div>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground font-mono">
              {appError.type} error: {appError.message}
            </div>
          )}
        </div>

        {appError.retryable && onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-4">
            {retryLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
