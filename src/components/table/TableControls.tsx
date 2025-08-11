'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutoRefreshInfo } from './AutoRefreshInfo';

interface TableControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  lastUpdated?: number;
  refreshInterval: number;
  staleTime?: number;
}

export function TableControls({
  query,
  onQueryChange,
  onRefresh,
  isFetching,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  lastUpdated,
  refreshInterval,
  staleTime,
}: TableControlsProps) {
  return (
    <div className="mb-3 mt-12 flex flex-col gap-2 md:mb-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            disabled={isFetching}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-8"
            placeholder="Search by asset, symbol, or chain..."
          />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <AutoRefreshInfo
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={onToggleAutoRefresh}
          isFetching={isFetching}
          lastUpdated={lastUpdated}
          refreshInterval={refreshInterval}
          staleTime={staleTime}
        />

        <Button
          disabled={isFetching}
          variant="outline"
          size="sm"
          className="gap-1 bg-transparent"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
