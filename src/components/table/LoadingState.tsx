'use client';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading markets...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-muted-foreground">{message}</div>
    </div>
  );
}
