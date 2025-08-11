'use client';

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message = 'Failed to load markets',
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="text-destructive">{message}</div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
