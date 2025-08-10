'use client';

import { useQuery } from '@tanstack/react-query';
import type { Market } from '@/config/markets';
import { usePageVisible } from '@/hooks/use-page-visible';

export function useAaveData(
  markets: Market[],
  { refreshMs = 30_000 }: { refreshMs?: number } = {},
) {
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['aave', 'apy', markets.map((m) => `${m.chainId}:${m.id}`).join('|')],
    queryFn: async () => {
      const res = await fetch('/api/aave/apy', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
    refetchInterval: visible ? refreshMs : false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
