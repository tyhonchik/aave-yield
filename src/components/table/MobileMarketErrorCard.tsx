'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MarketError } from '@/hooks/use-aave-markets';

interface MobileMarketErrorCardProps {
  error: MarketError;
  isConnected: boolean;
  onRetry: () => void;
}

export function MobileMarketErrorCard({ error, onRetry }: MobileMarketErrorCardProps) {
  return (
    <Card className="mb-2 border-destructive/20 bg-destructive/5">
      <CardContent className="px-3 py-1">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm mb-1">Failed to load market</div>
            <div className="text-sm text-muted-foreground mb-1">
              {error.marketName} on {error.chainName}
            </div>
            <div className="text-xs text-destructive mb-2 break-words">{error.message}</div>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1 h-7">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
