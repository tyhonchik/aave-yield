'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TokenBalance } from '@/hooks/use-user-balances';
import { formatBalanceForDisplay } from '@/hooks/use-user-balances';

interface BalanceCellProps {
  isLoading: boolean;
  balance: TokenBalance | undefined;
  balancesError?: Error & { code?: string; status?: number };
}

export function BalanceCell({ isLoading, balance, balancesError }: BalanceCellProps) {
  if (isLoading) {
    return <span className="inline-block h-3 w-12 animate-pulse rounded bg-muted" />;
  }

  const displayValue = formatBalanceForDisplay(balance);
  const hasIndividualError = balance?.error;
  const hasGlobalError = balancesError && !balance;

  if (hasIndividualError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-destructive cursor-help">{displayValue}</span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div>Failed to load balance</div>
            {balancesError?.code && (
              <div className="text-xs opacity-75 mt-1">Code: {balancesError.code}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (hasGlobalError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-destructive cursor-help">Error</span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div>{balancesError.message}</div>
            {balancesError.code && (
              <div className="text-xs opacity-75 mt-1">Code: {balancesError.code}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <span>{displayValue}</span>;
}
