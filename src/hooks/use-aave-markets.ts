'use client';

import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';
import { QUERY_CONFIG } from '@/config/query-config';
import { apiRequestJSON, shouldRetryRequest } from '@/lib/fetch';

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

export type MarketError = {
  id: string;
  chainId: number;
  chainName: string;
  marketName: string;
  error: string;
  retryable: boolean;
};

export function useAaveMarkets({
  refetchInterval = QUERY_CONFIG.MARKETS_REFRESH_INTERVAL,
}: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: ['aave-markets'],
    queryFn: async (): Promise<{ markets: MarketReserve[]; errors: MarketError[] }> => {
      const data = await apiRequestJSON<{ markets: MarketReserve[]; errors: MarketError[] }>(
        '/api/aave/markets',
      );

      if (!data.markets || !Array.isArray(data.markets)) {
        throw new Error('Invalid response format from server');
      }

      return {
        markets: data.markets,
        errors: data.errors || [],
      };
    },
    staleTime: QUERY_CONFIG.MARKETS_STALE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
    retry: shouldRetryRequest,
  });
}
