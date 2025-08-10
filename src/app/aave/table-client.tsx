'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReserveRow } from '@/data/aave/queries';
import { formatApy } from '@/lib/format';

type Row = {
  id: string;
  market: string;
  chain: string;
  reserve: string;
  symbol: string;
  apy: number;
};

type SortKey = 'apy' | 'market' | 'reserve' | 'symbol';
type SortDir = 'asc' | 'desc';

export default function ApyTable({ initialData }: { initialData: ReserveRow[] }) {
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

  const rows = useMemo(() => {
    const mapped: Row[] = (fetched ?? []).map((r, idx) => ({
      id: `${idx}`,
      market: r.marketName,
      chain: r.chainName,
      reserve: r.asset,
      symbol: r.symbol,
      apy: r.apy,
    }));
    const q = query.trim().toLowerCase();
    const filtered = mapped.filter(
      (r) =>
        !q ||
        r.symbol.toLowerCase().includes(q) ||
        r.reserve.toLowerCase().includes(q) ||
        r.market.toLowerCase().includes(q),
    );
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'apy') return sortDir === 'desc' ? b.apy - a.apy : a.apy - b.apy;
      const av = String(a[sortKey]).toLowerCase();
      const bv = String(b[sortKey]).toLowerCase();
      return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
    });
    return sorted;
  }, [fetched, query, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

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

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <Th
                label="Market / Chain"
                active={sortKey === 'market'}
                dir={sortDir}
                onClick={() => toggleSort('market')}
              />
              <Th
                label="Reserve"
                active={sortKey === 'reserve'}
                dir={sortDir}
                onClick={() => toggleSort('reserve')}
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
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t transition-colors hover:bg-muted/40">
                <td className="px-4 py-2 align-top">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.market}</span>
                    <div className="mt-0.5 inline-flex items-center gap-1">
                      <Badge variant="secondary">{r.chain}</Badge>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">{r.reserve}</td>
                <td className="px-4 py-2">{r.symbol}</td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold">
                  {formatApy(r.apy)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
  return (
    <th
      className="group px-4 py-2 text-sm font-medium text-muted-foreground select-none"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className={`flex items-center ${justify} gap-1`}>
        <span>{label}</span>
      </div>
    </th>
  );
}
