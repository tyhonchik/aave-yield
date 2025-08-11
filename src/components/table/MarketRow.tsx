'use client';

import { ChainIndicator, TokenIndicator } from '@/components/shared/icons';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import type { MarketReserve } from '@/hooks/use-aave-markets';
import type { TokenBalance } from '@/hooks/use-user-balances';
import { formatApy } from '@/lib/format';
import { BalanceCell } from './BalanceCell';

interface MarketRowProps {
  reserve: MarketReserve;
  isConnected: boolean;
  isBalancesFetching: boolean;
  balance?: TokenBalance;
  balancesError?: Error & { code?: string; status?: number };
}

export function MarketRow({
  reserve,
  isConnected,
  isBalancesFetching,
  balance,
  balancesError,
}: MarketRowProps) {
  const getApyColor = (apy: number) => {
    if (apy > 8) return 'text-emerald-600 dark:text-emerald-400';
    if (apy > 3) return 'text-green-600 dark:text-green-400';
    return 'text-muted-foreground';
  };

  return (
    <TableRow className="border-t transition-colors hover:bg-muted/40">
      <TableCell className="px-4 py-3">
        <div className="flex items-start gap-2">
          <ChainIndicator chainId={reserve.chainId} />
          <div className="flex flex-col">
            <span className="font-medium">{reserve.marketName}</span>
            <Badge variant="secondary" className="text-xs w-fit">
              {reserve.chainName}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <TokenIndicator symbol={reserve.symbol} />
          <span className="font-medium">{reserve.name}</span>
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">{reserve.symbol}</TableCell>
      <TableCell className="px-4 py-3 text-right">
        <span className={`tabular-nums font-semibold ${getApyColor(reserve.apy)}`}>
          {formatApy(reserve.apy)}
        </span>
      </TableCell>
      {isConnected && (
        <TableCell className="px-4 py-3 text-right tabular-nums min-w-[4rem]">
          <BalanceCell
            isLoading={isBalancesFetching}
            balance={balance}
            balancesError={balancesError}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
