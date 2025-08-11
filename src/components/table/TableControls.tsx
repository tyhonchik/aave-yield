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
    <div className="mb-4 mt-8 md:mt-12 space-y-3 md:space-y-0 md:flex md:items-end md:justify-between">
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative w-full md:max-w-md">
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

      {/* Controls */}
      <div className="flex items-center gap-2">
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
          className="gap-1.5 bg-transparent w-8 h-8 p-0 sm:w-auto sm:h-auto sm:px-3 sm:py-2"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
