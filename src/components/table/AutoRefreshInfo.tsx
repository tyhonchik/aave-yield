'use client';

import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateNextRefreshTime, QUERY_CONFIG } from '@/config/query-config';
import { cn } from '@/lib/utils';

interface AutoRefreshInfoProps {
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  isFetching: boolean;
  lastUpdated?: number;
  refreshInterval: number;
  staleTime?: number;
}

export function AutoRefreshInfo({
  autoRefreshEnabled,
  onToggleAutoRefresh,
  isFetching,
  lastUpdated,
  refreshInterval,
  staleTime = QUERY_CONFIG.MARKETS_STALE_TIME,
}: AutoRefreshInfoProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!autoRefreshEnabled || refreshInterval <= 0) {
      setSecondsLeft(0);
      return;
    }

    const updateCountdown = () => {
      const refreshInfo = calculateNextRefreshTime(lastUpdated, refreshInterval, staleTime);
      setSecondsLeft(refreshInfo.remainingSeconds);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, QUERY_CONFIG.UI_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, lastUpdated, staleTime]);

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString(undefined, { hour12: false })
    : '—';

  return (
    <div className="flex flex-col items-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'text-[11px] leading-none text-muted-foreground hover:underline underline-offset-2',
              'transition-colors',
            )}
            onClick={onToggleAutoRefresh}
          >
            {autoRefreshEnabled
              ? secondsLeft > 0
                ? `Autorefresh in ${secondsLeft} seconds`
                : 'Data is stale, refreshing soon...'
              : 'Autorefresh off'}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {autoRefreshEnabled ? 'Click to disable autorefresh' : 'Click to enable autorefresh'}
          </p>
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-1">
        {!isFetching && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last updated {formattedTime}
          </span>
        )}
        {isFetching && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            updating...
          </span>
        )}
      </div>
    </div>
  );
}
