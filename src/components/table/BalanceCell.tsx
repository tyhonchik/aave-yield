'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TokenBalance } from '@/hooks/use-user-balances';
import { formatBalanceForDisplay } from '@/hooks/use-user-balances';

interface BalanceCellProps {
  isLoading: boolean;
  balance: TokenBalance | undefined;
}

export function BalanceCell({ isLoading, balance }: BalanceCellProps) {
  if (isLoading) {
    return <span className="inline-block h-3 w-12 animate-pulse rounded bg-muted" />;
  }

  const displayValue = formatBalanceForDisplay(balance);
  const hasError = balance?.error;

  if (hasError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-destructive cursor-help">{displayValue}</span>
        </TooltipTrigger>
        <TooltipContent>Failed to load balance</TooltipContent>
      </Tooltip>
    );
  }

  return <span>{displayValue}</span>;
}
