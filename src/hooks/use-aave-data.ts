'use client';

import { useQuery } from '@tanstack/react-query';
import type { Market } from '@/config/markets';

export function useAaveData(
  markets: Market[],
  { refreshMs = 20_000 }: { refreshMs?: number } = {},
) {
  return useQuery({
    queryKey: ['aave', 'apy', markets.map((m) => `${m.chainId}:${m.id}`).join('|')],
    queryFn: async () => {
      const res = await fetch('/api/aave/apy', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data;
    },
    staleTime: refreshMs,
    refetchInterval: refreshMs,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
