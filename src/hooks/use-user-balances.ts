'use client';

import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';
import { QUERY_CONFIG } from '@/config/query-config';
import { apiRequestJSON, shouldRetryRequest } from '@/lib/fetch';
import { useTestWallet } from '@/providers/TestWalletProvider';

export type TokenBalance = {
  chainId: number;
  asset: Address;
  balance: string;
  formatted: string;
  error?: boolean;
};

export type BalanceMap = Map<string, TokenBalance>;

export type AssetIdentifier = {
  chainId: number;
  asset: Address;
};

/**
 * Hook for fetching user balances for specified assets
 */
export function useUserBalances(
  assets: AssetIdentifier[],
  { refetchInterval = QUERY_CONFIG.BALANCES_REFRESH_INTERVAL } = {},
) {
  // Try test wallet first, then real wallet
  const testWallet = useTestWallet();
  const { address: realAddress } = useAccount();
  const address = testWallet.isConnected ? testWallet.address : realAddress;

  return useQuery({
    queryKey: ['user-balances', address, assets.map((a) => `${a.chainId}-${a.asset}`).join(',')],
    queryFn: async (): Promise<BalanceMap> => {
      if (!address || assets.length === 0) {
        return new Map();
      }

      const data = await apiRequestJSON<{ balances: TokenBalance[] }>('/api/user/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          assets: assets.map((a) => ({
            chainId: a.chainId,
            asset: a.asset,
          })),
        }),
      });

      // Convert to Map for easy lookup
      const balanceMap = new Map<string, TokenBalance>();

      if (data.balances && Array.isArray(data.balances)) {
        for (const balance of data.balances) {
          const key = `${balance.chainId}-${balance.asset.toLowerCase()}`;
          balanceMap.set(key, balance);
        }
      }

      return balanceMap;
    },
    enabled: Boolean(address && assets.length > 0),
    staleTime: QUERY_CONFIG.BALANCES_STALE_TIME,
    refetchInterval,
    refetchOnWindowFocus: false,
    retry: shouldRetryRequest,
  });
}

/**
 * Utility function to get balance for a specific asset
 */
export function getAssetBalance(
  balanceMap: BalanceMap | undefined,
  chainId: number,
  asset: Address,
): TokenBalance | undefined {
  if (!balanceMap) return undefined;

  const key = `${chainId}-${asset.toLowerCase()}`;
  return balanceMap.get(key);
}

/**
 * Utility function to format balance for display
 */
export function formatBalanceForDisplay(balance: TokenBalance | undefined): string {
  if (!balance) return '—';

  // Show error state
  if (balance.error) return 'N/A';

  const num = parseFloat(balance.formatted);
  if (isNaN(num)) return 'N/A';
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}
