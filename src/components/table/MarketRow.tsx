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
}

export function MarketRow({ reserve, isConnected, isBalancesFetching, balance }: MarketRowProps) {
  return (
    <TableRow key={reserve.id}>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium inline-flex items-center gap-2">
            <ChainIndicator chainId={reserve.chainId} />
            {reserve.marketName}
          </span>
          <div className="mt-0.5 inline-flex items-center gap-1">
            <Badge variant="secondary">{reserve.chainName}</Badge>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <TokenIndicator symbol={reserve.symbol} />
          {reserve.name}
        </span>
      </TableCell>
      <TableCell>{reserve.symbol}</TableCell>
      <TableCell className="text-right tabular-nums font-semibold">
        {formatApy(reserve.apy)}
      </TableCell>
      {isConnected && (
        <TableCell className="text-right tabular-nums min-w-[4rem]">
          <BalanceCell isLoading={isBalancesFetching} balance={balance} />
        </TableCell>
      )}
    </TableRow>
  );
}
