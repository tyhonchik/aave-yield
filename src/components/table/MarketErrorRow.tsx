'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { ChainIndicator } from '@/components/shared/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { MarketError } from '@/hooks/use-aave-markets';

interface MarketErrorRowProps {
  error: MarketError;
  isConnected: boolean;
  onRetry?: () => void;
}

export function MarketErrorRow({ error, isConnected, onRetry }: MarketErrorRowProps) {
  return (
    <TableRow className="border-t transition-colors hover:bg-muted/40">
      <TableCell className="px-4 py-3">
        <div className="flex items-start gap-2">
          <ChainIndicator chainId={error.chainId} />
          <div className="flex flex-col">
            <span className="font-medium">{error.marketName}</span>
            <Badge variant="secondary" className="text-xs w-fit">
              {error.chainName}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3" colSpan={isConnected ? 4 : 3}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{error.error}</span>
            </div>
            {error.id.startsWith('asset-') && (
              <div className="text-xs text-muted-foreground">Error loading asset data</div>
            )}
          </div>
          {error.retryable && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="w-3 h-3" />
              Try again
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
