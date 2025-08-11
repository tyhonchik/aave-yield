'use client';

import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import {
  ErrorState,
  LoadingState,
  MarketRow,
  MarketTableHeader,
  TableControls,
} from '@/components/table';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAaveMarkets } from '@/hooks/use-aave-markets';
import { useTableFiltering } from '@/hooks/use-table-filtering';
import { useTableSorting } from '@/hooks/use-table-sorting';
import { getAssetBalance, useUserBalances } from '@/hooks/use-user-balances';
import { useTestWallet } from '@/providers/TestWalletProvider';

export default function ApyTable() {
  const testWallet = useTestWallet();
  const { isConnected: realWalletConnected } = useAccount();
  const isConnected = testWallet.isConnected || realWalletConnected;

  const {
    data: markets = [],
    isLoading,
    isFetching,
    error: marketsError,
    refetch,
  } = useAaveMarkets();

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
  } = useUserBalances(assets, {
    refetchInterval: 45000,
  });

  const { query, setQuery, filteredItems } = useTableFiltering(markets);
  const { sortKey, sortDir, sortedItems, toggleSort } = useTableSorting(filteredItems);

  if (isLoading) {
    return <LoadingState />;
  }

  if (marketsError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <TooltipProvider>
      <TableControls
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => refetch()}
        isFetching={isFetching}
        hasBalanceErrors={Boolean(balancesError)}
        isConnected={isConnected}
      />

      <Table>
        <MarketTableHeader
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          isConnected={isConnected}
        />
        <TableBody>
          {sortedItems.map((reserve) => (
            <MarketRow
              key={reserve.id}
              reserve={reserve}
              isConnected={isConnected}
              isBalancesFetching={isBalancesFetching}
              balance={getAssetBalance(balances, reserve.chainId, reserve.asset)}
            />
          ))}
          {sortedItems.length === 0 && (
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
    </TooltipProvider>
  );
}
