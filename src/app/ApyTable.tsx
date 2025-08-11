'use client';

import { useAccount } from 'wagmi';
import { useMemo, useState } from 'react';
import {
  ErrorState,
  LoadingState,
  MarketErrorRow,
  MarketRow,
  MarketTableHeader,
  MobileMarketCard,
  MobileMarketErrorCard,
  TableControls,
} from '@/components/table';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QUERY_CONFIG } from '@/config/query-config';
import { useAaveMarkets } from '@/hooks/use-aave-markets';
import { useTableFiltering } from '@/hooks/use-table-filtering';
import { useTableSorting } from '@/hooks/use-table-sorting';
import { getAssetBalance, useUserBalances } from '@/hooks/use-user-balances';
import { AppError } from '@/lib/error';
import { showInfoNotification } from '@/lib/notifications';
import { useTestWallet } from '@/providers/TestWalletProvider';

export default function ApyTable() {
  const testWallet = useTestWallet();
  const { isConnected: realWalletConnected } = useAccount();
  const isConnected = testWallet.isConnected || realWalletConnected;

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const {
    data,
    isLoading,
    isFetching,
    error: marketsError,
    refetch,
    dataUpdatedAt,
  } = useAaveMarkets({
    refetchInterval: autoRefreshEnabled ? QUERY_CONFIG.MARKETS_REFRESH_INTERVAL : false,
  });

  const markets = useMemo(() => data?.markets || [], [data?.markets]);
  const marketErrors = useMemo(() => data?.errors || [], [data?.errors]);

  const assets = useMemo(
    () =>
      markets.map((market) => ({
        chainId: market.chainId,
        asset: market.asset,
      })),
    [markets],
  );

  const {
    data: balances,
    isFetching: isBalancesFetching,
    error: balancesError,
  } = useUserBalances(assets);

  const { query, setQuery, filteredItems } = useTableFiltering(markets);
  const { sortKey, sortDir, sortedItems, toggleSort } = useTableSorting(filteredItems);

  useMemo(() => {
    if (marketErrors.length > 0 && markets.length > 0) {
      const errorCount = marketErrors.length;
      const successCount = markets.length;

      showInfoNotification(
        `Loaded ${successCount} markets with ${errorCount} errors. Some data may be incomplete.`,
      );
    }
  }, [marketErrors.length, markets.length]);

  if (isLoading) {
    return <LoadingState isConnected={isConnected} />;
  }

  if (marketsError && markets.length === 0) {
    return <ErrorState error={marketsError} onRetry={() => refetch()} />;
  }

  return (
    <TooltipProvider>
      <TableControls
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => refetch()}
        isFetching={isFetching}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        lastUpdated={dataUpdatedAt}
        refreshInterval={QUERY_CONFIG.MARKETS_REFRESH_INTERVAL}
        staleTime={QUERY_CONFIG.MARKETS_STALE_TIME}
      />

      <Card className="overflow-hidden py-0 hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <MarketTableHeader
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              isConnected={isConnected}
            />
            <TableBody
              className={isFetching ? 'transition-opacity opacity-50' : 'transition-opacity'}
            >
              {sortedItems.map((reserve) => (
                <MarketRow
                  key={reserve.id}
                  reserve={reserve}
                  isConnected={isConnected}
                  isBalancesFetching={isBalancesFetching}
                  balance={getAssetBalance(balances, reserve.chainId, reserve.asset)}
                  balancesError={balancesError as AppError | undefined}
                />
              ))}
              {marketErrors.map((error) => (
                <MarketErrorRow
                  key={error.id}
                  error={error}
                  isConnected={isConnected}
                  onRetry={() => refetch()}
                />
              ))}
              {sortedItems.length === 0 && marketErrors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isConnected ? 5 : 4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className={isFetching ? 'transition-opacity opacity-50' : 'transition-opacity'}>
          {sortedItems.map((reserve) => (
            <MobileMarketCard
              key={reserve.id}
              reserve={reserve}
              isConnected={isConnected}
              isBalancesFetching={isBalancesFetching}
              balance={getAssetBalance(balances, reserve.chainId, reserve.asset)}
              balancesError={balancesError as AppError | undefined}
            />
          ))}
          {marketErrors.map((error) => (
            <MobileMarketErrorCard
              key={error.id}
              error={error}
              isConnected={isConnected}
              onRetry={() => refetch()}
            />
          ))}
          {sortedItems.length === 0 && marketErrors.length === 0 && (
            <Card>
              <div className="py-12 text-center text-muted-foreground">No results</div>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
