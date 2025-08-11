'use client';

import { ChainIndicator, TokenIndicator } from '@/components/shared/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { MarketReserve } from '@/hooks/use-aave-markets';
import type { TokenBalance } from '@/hooks/use-user-balances';
import { formatApy } from '@/lib/format';
import { BalanceCell } from './BalanceCell';

interface MobileMarketCardProps {
  reserve: MarketReserve;
  isConnected: boolean;
  isBalancesFetching: boolean;
  balance?: TokenBalance;
  balancesError?: Error & { code?: string; status?: number };
}

export function MobileMarketCard({
  reserve,
  isConnected,
  isBalancesFetching,
  balance,
  balancesError,
}: MobileMarketCardProps) {
  const getApyColor = (apy: number) => {
    if (apy > 8) return 'text-emerald-600 dark:text-emerald-400';
    if (apy > 3) return 'text-green-600 dark:text-green-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className="mb-2 transition-all hover:shadow-md">
      <CardContent className="px-3 py-1">
        {/* Header with Chain and Market */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-start gap-2">
            <ChainIndicator chainId={reserve.chainId} />
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">{reserve.marketName}</span>
              <Badge variant="secondary" className="text-xs w-fit mt-0.5">
                {reserve.chainName}
              </Badge>
            </div>
          </div>

          {/* APY - prominent display */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-0.5">Supply APY</div>
            <div className={`text-base font-bold tabular-nums ${getApyColor(reserve.apy)}`}>
              {formatApy(reserve.apy)}
            </div>
          </div>
        </div>

        {/* Asset Information */}
        <div className={`flex items-center justify-between ${isConnected ? 'mb-2' : ''}`}>
          <div className="flex items-center gap-2">
            <TokenIndicator symbol={reserve.symbol} />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{reserve.name}</span>
              <span className="text-xs text-muted-foreground">{reserve.symbol}</span>
            </div>
          </div>
        </div>

        {/* Balance Section */}
        {isConnected && (
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Balance</span>
              <div className="text-right tabular-nums">
                <BalanceCell
                  isLoading={isBalancesFetching}
                  balance={balance}
                  balancesError={balancesError}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
