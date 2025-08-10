'use client';

import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatApy } from '@/lib/format';

type Row = {
  id: string;
  market: string;
  chain: string;
  reserve: string;
  symbol: string;
  apy: number;
  balance?: string;
};

type SortKey = 'apy' | 'market' | 'reserve' | 'symbol';
type SortDir = 'asc' | 'desc';

const MOCK_ROWS: Row[] = [
  {
    id: '1',
    market: 'Aave V3 Ethereum',
    chain: 'Ethereum',
    reserve: 'USD Coin',
    symbol: 'USDC',
    apy: 2.35,
    balance: '100.00',
  },
  {
    id: '2',
    market: 'Aave V3 Polygon',
    chain: 'Polygon',
    reserve: 'Wrapped Ether',
    symbol: 'WETH',
    apy: 3.8,
  },
  {
    id: '3',
    market: 'Aave V3 Base',
    chain: 'Base',
    reserve: 'Wrapped BTC',
    symbol: 'WBTC',
    apy: 8.1,
  },
];

export default function AavePage() {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = MOCK_ROWS.filter(
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
  }, [query, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-muted to-background p-2 shadow-sm">
              <div className="h-6 w-6 rounded bg-emerald-500/90 shadow-inner" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight md:text-2xl">Aave Supply Yield</h1>
              <p className="text-sm text-muted-foreground">
                Live Supply APY across Aave V3 markets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Connect
            </Button>
          </div>
        </header>

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => setIsLoading(false), 800);
                  }}
                >
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manual refresh</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[1.5fr_1fr_0.7fr_0.7fr] md:items-center md:px-4 md:py-3"
                >
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <div className="hidden md:block">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="md:ml-auto">
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Something went wrong while loading data.
              </p>
              <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs">
                {error}
              </code>
              <Button onClick={() => setError(null)} className="mt-1">
                Try again
              </Button>
            </div>
          ) : (
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
                  {data.map((r) => (
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
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
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
