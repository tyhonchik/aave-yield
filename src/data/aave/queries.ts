import { formatUnits, type Address } from 'viem';
import { createChains } from '@/config/chains';
import type { Env } from '@/config/env';
import type { Market } from '@/config/markets';
import { ERC20Abi, IPoolAbi, UiPoolDataProviderV3Abi } from './abis';

export type ReserveRow = {
  chainId: number;
  chainName: string;
  marketId: string;
  marketName: string;
  asset: Address;
  symbol: string;
  decimals: number;
  apy: number;
};

export function computeApyFromRay(liquidityRateRay: bigint): number {
  const rate = Number(formatUnits(liquidityRateRay, 27));
  return rate * 100;
}

type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && now - entry.at < ttlMs) return entry.data;
  const data = await fetcher();
  cache.set(key, { at: now, data });
  return data;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

export async function getReservesViaUiProvider(env: Env, market: Market): Promise<ReserveRow[]> {
  const { CHAINS } = createChains(env);
  const cfg = CHAINS[market.chainId];
  if (!cfg) throw new Error(`Unsupported chain ${market.chainId}`);
  if (!market.uiPoolDataProvider) throw new Error('UI_POOL_DATA_PROVIDER not available');

  const client = (await import('viem')).createPublicClient({
    chain: cfg.chain,
    transport: cfg.transport,
  });
  const res = await client.readContract({
    address: market.uiPoolDataProvider,
    abi: UiPoolDataProviderV3Abi,
    functionName: 'getReservesData',
    args: [market.addressesProvider!],
  });

  const [uiReserves] = res;
  const reserves: ReserveRow[] = uiReserves.map(([reserve]) => ({
    chainId: market.chainId,
    chainName: cfg.name,
    marketId: market.id,
    marketName: market.label,
    asset: reserve.underlyingAsset,
    symbol: reserve.symbol,
    decimals: Number(reserve.decimals),
    apy: computeApyFromRay(BigInt(reserve.liquidityRate)),
  }));
  return reserves;
}

export async function getReservesViaPool(env: Env, market: Market): Promise<ReserveRow[]> {
  const { CHAINS } = createChains(env);
  const cfg = CHAINS[market.chainId];
  if (!cfg) throw new Error(`Unsupported chain ${market.chainId}`);
  const client = (await import('viem')).createPublicClient({
    chain: cfg.chain,
    transport: cfg.transport,
  });

  const assets = await client.readContract({
    address: market.pool,
    abi: IPoolAbi,
    functionName: 'getReservesList',
  });

  if (!assets.length) return [];

  const reserveCalls = assets.map((asset) => ({
    address: market.pool,
    abi: IPoolAbi,
    functionName: 'getReserveData',
    args: [asset],
  }));

  const metaCalls = assets.flatMap((asset) => [
    { address: asset, abi: ERC20Abi, functionName: 'symbol' },
    { address: asset, abi: ERC20Abi, functionName: 'decimals' },
  ]);

  const [reserveResults, metaResults] = await Promise.all([
    client.multicall({
      contracts: reserveCalls,
      batchSize: 50,
    }),
    client.multicall({
      contracts: metaCalls,
      batchSize: 50,
    }),
  ]);

  const out: ReserveRow[] = [];
  for (let i = 0; i < assets.length; i++) {
    const r = reserveResults[i];
    const sym = metaResults[i * 2 + 0];
    const dec = metaResults[i * 2 + 1];
    const liquidityRate = r.status === 'success' && r.result?.[0] ? r.result[0] : 0n;
    const symbol = sym.status === 'success' ? sym.result : '';
    const decimals = dec.status === 'success' ? Number(dec.result) : 18;

    out.push({
      chainId: market.chainId,
      chainName: cfg.name,
      marketId: market.id,
      marketName: market.label,
      asset: assets[i],
      symbol: String(symbol),
      decimals,
      apy: computeApyFromRay(
        typeof liquidityRate === 'bigint' ? liquidityRate : BigInt(liquidityRate),
      ),
    });
  }
  return out;
}

export async function getMarketReservesApy(
  env: Env,
  market: Market,
  ttlMs = 15_000,
): Promise<ReserveRow[]> {
  const key = `market:${market.chainId}:${market.id}`;
  return cached(key, ttlMs, async () => {
    try {
      if (market.uiPoolDataProvider) return await getReservesViaUiProvider(env, market);
    } catch {}
    try {
      return await getReservesViaPool(env, market);
    } catch {
      return [];
    }
  });
}

export async function getAllMarketsApy(
  env: Env,
  markets: Market[],
  concurrency = 3,
): Promise<ReserveRow[]> {
  const chunks = chunkArray(markets, concurrency);
  const all: ReserveRow[] = [];
  for (const ch of chunks) {
    const part = await Promise.all(ch.map((m) => getMarketReservesApy(env, m)));
    for (const arr of part) all.push(...arr);
  }
  return all;
}
