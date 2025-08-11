'use client';

import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';

export type MarketReserve = {
  id: string;
  chainId: number;
  chainName: string;
  marketName: string;
  asset: Address;
  symbol: string;
  name: string;
  decimals: number;
  apy: number;
};

export function useAaveMarkets({ refetchInterval = 30000 } = {}) {
  return useQuery({
    queryKey: ['aave-markets'],
    queryFn: async (): Promise<MarketReserve[]> => {
      const response = await fetch('/api/aave/markets');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data = await response.json();
      return data.markets;
    },
    staleTime: 15000,
    refetchInterval,
    refetchOnWindowFocus: false,
  });
}
