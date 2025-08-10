'use client';

import { useQuery } from '@tanstack/react-query';
import { formatUnits, isAddress, type Address } from 'viem';
import { useConfig } from 'wagmi';
import { getPublicClient as wagmiGetPublicClient } from 'wagmi/actions';
import { useMemo } from 'react';
import { ERC20Abi } from '@/data/aave/abis';
import { useTestWallet } from '@/providers/TestWalletProvider';

export type BalanceItem = { chainId: number; asset: Address };
export type BalanceKey = `${number}:${Lowercase<Address>}`;
export type RawBalance = { raw: bigint; decimals: number; ok: boolean };
export type FormattedBalance = string;

const decimalsCache = new Map<BalanceKey, number>();

function chunkArray<T>(items: readonly T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items.slice()];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function normalizeItems(items: BalanceItem[] | undefined): {
  perChain: Map<number, Address[]>;
  key: string;
  uniqueList: Array<{ chainId: number; assetLower: Lowercase<Address> }>;
} {
  const perChain = new Map<number, Address[]>();
  if (!items?.length) return { perChain, key: '', uniqueList: [] };

  const unique = new Set<BalanceKey>();
  const uniqueList: Array<{ chainId: number; assetLower: Lowercase<Address> }> = [];

  for (const item of items) {
    if (!item || typeof item.chainId !== 'number') continue;

    const assetLower = (item.asset?.toLowerCase() ?? '') as Lowercase<Address>;
    if (!isAddress(assetLower)) continue;

    const k: BalanceKey = `${item.chainId}:${assetLower}`;
    if (unique.has(k)) continue;
    unique.add(k);
    uniqueList.push({ chainId: item.chainId, assetLower });

    const arr = perChain.get(item.chainId) ?? [];
    perChain.set(item.chainId, [...arr, assetLower]);
  }

  const key = Array.from(unique.values()).sort().join(',');
  return { perChain, key, uniqueList };
}

type WagmiConfig = Parameters<typeof wagmiGetPublicClient>[0];
type WagmiPublicClient = Awaited<ReturnType<typeof wagmiGetPublicClient>>;

export async function getClient(
  config: WagmiConfig,
  chainId: number,
): Promise<WagmiPublicClient | null> {
  try {
    const client = await wagmiGetPublicClient(config, { chainId });
    return client ?? null;
  } catch {
    return null;
  }
}

export async function getDecimals(
  chainId: number,
  assets: readonly Address[],
  client: WagmiPublicClient,
): Promise<Map<Lowercase<Address>, number>> {
  const result = new Map<Lowercase<Address>, number>();
  if (assets.length === 0) return result;

  const missing: Address[] = [];
  for (const asset of assets) {
    const key = `${chainId}:${asset.toLowerCase()}` as BalanceKey;
    const cached = decimalsCache.get(key);
    if (typeof cached === 'number') {
      result.set(asset.toLowerCase() as Lowercase<Address>, cached);
    } else {
      missing.push(asset);
    }
  }

  if (missing.length === 0) return result;

  const calls = missing.map((asset) => ({
    address: asset,
    abi: ERC20Abi,
    functionName: 'decimals' as const,
  }));

  const chunks = chunkArray(calls, 50);
  for (const chunk of chunks) {
    const responses = await client.multicall({ contracts: chunk, allowFailure: true });
    for (let i = 0; i < chunk.length; i++) {
      const asset = chunk[i]!.address as Address;
      const key = `${chainId}:${asset.toLowerCase()}` as BalanceKey;
      const r = responses[i];
      let decimals = 18;
      if (r?.status === 'success' && typeof (r as { result?: unknown }).result === 'number') {
        const value = (r as { result: number }).result;
        decimals = value >= 0 && value <= 36 ? value : 18;
      }
      decimalsCache.set(key, decimals);
      result.set(asset.toLowerCase() as Lowercase<Address>, decimals);
    }
  }

  return result;
}

export async function getBalances(
  chainId: number,
  assets: readonly Address[],
  client: WagmiPublicClient,
  decimalsMap: Map<Lowercase<Address>, number>,
  address: Address,
  signal?: AbortSignal,
): Promise<Map<Lowercase<Address>, string>> {
  const out = new Map<Lowercase<Address>, string>();
  if (assets.length === 0) return out;

  const calls = assets.map((asset) => ({
    address: asset,
    abi: ERC20Abi,
    functionName: 'balanceOf' as const,
    args: [address] as const,
  }));

  const chunks = chunkArray(calls, 50);
  for (const chunk of chunks) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const responses = await client.multicall({ contracts: chunk, allowFailure: true });
      for (let i = 0; i < chunk.length; i++) {
        const asset = chunk[i]!.address as Address;
        const lower = asset.toLowerCase() as Lowercase<Address>;
        const r = responses[i];
        const decimals = decimalsMap.get(lower) ?? 18;
        if (r?.status === 'success' && typeof (r as { result?: unknown }).result === 'bigint') {
          const raw = (r as { result: bigint }).result ?? 0n;
          out.set(lower, formatUnits(raw ?? 0n, decimals));
        } else {
          out.set(lower, 'na');
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('balances.multicall failed', { chainId, reason: (err as Error)?.message });
      }
      for (const c of chunk) {
        const lower = c.address.toLowerCase() as Lowercase<Address>;
        out.set(lower, 'na');
      }
    }
  }

  return out;
}

export async function fetchAllBalances(
  perChain: Map<number, Address[]>,
  address: Address,
  getClientFn: (chainId: number) => Promise<WagmiPublicClient | null>,
  signal?: AbortSignal,
): Promise<Record<BalanceKey, string>> {
  const entries = Array.from(perChain.entries());
  const results = await Promise.all(
    entries.map(async ([chainId, assets]) => {
      const client = await getClientFn(chainId);
      if (!client) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('no client', { chainId });
        }
        const rec: Record<BalanceKey, string> = {} as Record<BalanceKey, string>;
        for (const a of assets) rec[`${chainId}:${a.toLowerCase()}` as BalanceKey] = 'na';
        return rec;
      }
      try {
        const decimals = await getDecimals(chainId, assets, client);
        const balances = await getBalances(chainId, assets, client, decimals, address, signal);
        const rec: Record<BalanceKey, string> = {} as Record<BalanceKey, string>;
        for (const [assetLower, value] of balances.entries()) {
          rec[`${chainId}:${assetLower}` as BalanceKey] = value;
        }
        return rec;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err;
        if (process.env.NODE_ENV !== 'production') {
          console.debug('chain failed', { chainId, reason: (err as Error)?.message });
        }
        const rec: Record<BalanceKey, string> = {} as Record<BalanceKey, string>;
        for (const a of assets) rec[`${chainId}:${a.toLowerCase()}` as BalanceKey] = 'na';
        return rec;
      }
    }),
  );

  const merged: Record<BalanceKey, string> = {} as Record<BalanceKey, string>;
  for (const part of results) Object.assign(merged, part);
  return merged;
}

export function useBalances(
  items: BalanceItem[] | undefined,
  { refreshMs = 45_000 }: { refreshMs?: number } = {},
) {
  const { address, isConnected } = useTestWallet();
  const config = useConfig();

  const { perChain, key, uniqueList } = useMemo(() => normalizeItems(items), [items]);

  const addressLower = useMemo(
    () => (address && isAddress(address) ? (address.toLowerCase() as Lowercase<Address>) : null),
    [address],
  );

  return useQuery<Record<BalanceKey, string>>({
    enabled: Boolean(isConnected && addressLower && uniqueList.length),
    queryKey: ['aave', 'balances', addressLower, key],
    queryFn: async ({ signal }) => {
      if (!addressLower || uniqueList.length === 0) return {} as Record<BalanceKey, string>;

      const defaultRecord: Record<BalanceKey, string> = {} as Record<BalanceKey, string>;
      for (const u of uniqueList)
        defaultRecord[`${u.chainId}:${u.assetLower}` as BalanceKey] = 'na';

      const getClientOnce = ((): ((chainId: number) => Promise<WagmiPublicClient | null>) => {
        const local = new Map<number, WagmiPublicClient | null>();
        return async (cid: number) => {
          if (local.has(cid)) return local.get(cid) ?? null;
          const c = await getClient(config, cid);
          local.set(cid, c);
          return c;
        };
      })();

      try {
        const merged = await fetchAllBalances(perChain, addressLower, getClientOnce, signal);

        return { ...defaultRecord, ...merged };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err;

        return defaultRecord;
      }
    },
    staleTime: 60_000,
    refetchInterval: refreshMs,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
