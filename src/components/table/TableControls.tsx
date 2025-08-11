'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TableControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
  hasBalanceErrors: boolean;
  isConnected: boolean;
}

export function TableControls({
  query,
  onQueryChange,
  onRefresh,
  isFetching,
  hasBalanceErrors,
  isConnected,
}: TableControlsProps) {
  return (
    <div className="mb-3 mt-2 flex flex-col gap-2 md:mb-4 md:flex-row md:items-end md:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by asset, symbol, or chain..."
          aria-label="Search"
        />
      </div>
      <div className="flex items-center gap-2">
        {hasBalanceErrors && isConnected && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-destructive text-sm">Balance errors</div>
            </TooltipTrigger>
            <TooltipContent>Some balances failed to load</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
              {isFetching ? 'Updating…' : 'Refresh'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manual refresh</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
