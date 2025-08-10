'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ChainIndicator, TokenIndicator } from '@/components/shared/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReserveRow } from '@/data/aave/queries';
import { useBalances, type BalanceKey } from '@/hooks/use-balances';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatApy, formatBalance } from '@/lib/format';
import { useTestWallet } from '@/providers/TestWalletProvider';

type Row = {
  id: string;
  market: string;
  chain: string;
  chainId: number;
  reserve: string;
  reserveName: string;
  symbol: string;
  apy: number | null;
};

type SortKey = 'apy' | 'market' | 'reserve' | 'symbol' | 'reserveName';
type SortDir = 'asc' | 'desc';

export default function ApyTable({ initialData }: { initialData: ReserveRow[] }) {
  const keyFor = (chainId: number, asset: string): BalanceKey =>
    `${chainId}:${(asset as `0x${string}`).toLowerCase()}` as BalanceKey;
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const {
    data: fetched = initialData,
    isFetching,
    refetch,
  } = useQuery<ReserveRow[]>({
    queryKey: ['aave', 'apy'],
    queryFn: async () => {
      const res = await fetch('/api/aave/apy', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as ReserveRow[];
    },
    initialData,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const debouncedQuery = useDebouncedValue(query, 250);

  const rows = useMemo(() => {
    const mapped: Row[] = (fetched ?? []).map((row) => ({
      id: keyFor(row.chainId, row.asset),
      market: row.marketName,
      chain: row.chainName,
      chainId: row.chainId,
      reserve: row.asset,
      reserveName: row.name,
      symbol: row.symbol,
      apy: row.apy,
    }));
    const query = debouncedQuery.trim().toLowerCase();
    const filtered = mapped.filter(
      (row) =>
        !query ||
        row.symbol.toLowerCase().includes(query) ||
        row.reserveName.toLowerCase().includes(query) ||
        row.reserve.toLowerCase().includes(query) ||
        row.market.toLowerCase().includes(query),
    );
    const sorted = [...filtered].sort((row1, row2) => {
      if (sortKey === 'apy') {
        if (row1.apy === null && row2.apy === null) return 0;
        if (row1.apy === null) return 1;
        if (row2.apy === null) return -1;
        return sortDir === 'desc' ? row2.apy - row1.apy : row1.apy - row2.apy;
      }
      const av = String(row1[sortKey]).toLowerCase();
      const bv = String(row2[sortKey]).toLowerCase();
      return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
    });
    return sorted;
  }, [fetched, debouncedQuery, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

  const { isConnected } = useTestWallet();
  const items = useMemo(
    () =>
      (fetched ?? []).map((row) => ({ chainId: row.chainId, asset: row.asset as `0x${string}` })),
    [fetched],
  );
  const { data: balances, isFetching: isBalancesFetching } = useBalances(items);

  return (
    <TooltipProvider>
      <div className="mb-3 mt-2 flex flex-col gap-2 md:mb-4 md:flex-row md:items-end md:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by asset, symbol, or chain..."
            aria-label="Search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? 'Updating…' : 'Refresh'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manual refresh</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <Th
              label="Market / Chain"
              active={sortKey === 'market'}
              dir={sortDir}
              onClick={() => toggleSort('market')}
            />
            <Th
              label="Reserve"
              active={sortKey === 'reserveName'}
              dir={sortDir}
              onClick={() => toggleSort('reserveName')}
            />
            <Th
              label="Symbol"
              active={sortKey === 'symbol'}
              dir={sortDir}
              onClick={() => toggleSort('symbol')}
            />
            <Th
              label="Supply APY"
              active={sortKey === 'apy'}
              dir={sortDir}
              onClick={() => toggleSort('apy')}
              align="right"
            />
            {isConnected && <Th label="Balance" align="right" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ id, market, chainId, chain, reserve, reserveName, symbol, apy }) => (
            <TableRow key={id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium inline-flex items-center gap-2">
                    <ChainIndicator chainId={chainId} />
                    {market}
                  </span>
                  <div className="mt-0.5 inline-flex items-center gap-1">
                    <Badge variant="secondary">{chain}</Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <TokenIndicator symbol={symbol} />
                  {reserveName}
                </span>
              </TableCell>
              <TableCell>{symbol}</TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {formatApy(apy)}
              </TableCell>
              {isConnected && (
                <TableCell className="text-right tabular-nums min-w-[4rem]">
                  {isBalancesFetching ? (
                    <span className="inline-block h-3 w-12 animate-pulse rounded bg-muted" />
                  ) : (
                    formatBalance(balances?.[keyFor(chainId, reserve)] ?? null)
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
          {rows.length === 0 && (
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

function Th({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  active?: boolean;
  dir?: SortDir;
  onClick?: () => void;
  align?: 'left' | 'right';
}) {
  const justify = align === 'right' ? 'justify-end' : 'justify-start';
  const cursor = onClick ? 'cursor-pointer' : '';

  return (
    <TableHead
      className={`group text-sm font-medium text-muted-foreground select-none ${cursor}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className={`flex items-center ${justify} gap-1`}>
        <span>{label}</span>
        {onClick && (
          <span className="text-xs text-muted-foreground/50">
            {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
          </span>
        )}
      </div>
    </TableHead>
  );
}
