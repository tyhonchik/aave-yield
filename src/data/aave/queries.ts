import { formatUnits, type Address, type PublicClient } from 'viem';
import { createChains } from '@/config/chains';
import type { Env } from '@/config/env';
import type { Market } from '@/config/markets';
import { ERC20Abi, IPoolAbi, UiPoolDataProviderV3Abi } from './abis';

export type ReserveRow = {
  id: string;
  chainId: number;
  chainName: string;
  marketId: string;
  marketName: string;
  asset: Address;
  name: string;
  symbol: string;
  decimals: number;
  apy: number | null;
  source?: 'ui' | 'pool';
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get wagmi client for a specific chain, returns null if unsupported
 */
function getClient(env: Env, chainId: number): PublicClient | null {
  try {
    const { getPublicClient } = createChains(env);
    return getPublicClient(chainId);
  } catch {
    return null;
  }
}

/**
 * Pure computation of APY from ray-formatted liquidity rate
 * Aave uses the formula: APY = (1 + rate/SECONDS_PER_YEAR)^SECONDS_PER_YEAR - 1
 */
export function computeApyFromRay(liquidityRateRay: bigint): number {
  if (liquidityRateRay === 0n) return 0;

  // Convert from ray (27 decimals) to decimal
  const rate = Number(formatUnits(liquidityRateRay, 27));

  // Convert annual rate to percentage
  // The rate is already annualized in Aave V3
  return rate * 100;
}

/**
 * Validate and normalize token metadata with safe fallbacks
 */
function normalizeMeta(
  symbol: unknown,
  name: unknown,
  decimals: unknown,
): {
  symbol: string;
  name: string;
  decimals: number;
} {
  const symbolStr = typeof symbol === 'string' && symbol.trim() ? symbol.trim() : '—';
  const nameStr = typeof name === 'string' && name.trim() ? name.trim() : symbolStr;

  let decimalsNum = 18; // safe default
  if (
    typeof decimals === 'number' &&
    Number.isInteger(decimals) &&
    decimals >= 0 &&
    decimals <= 36
  ) {
    decimalsNum = decimals;
  } else if (typeof decimals === 'bigint') {
    const candidate = Number(decimals);
    if (Number.isInteger(candidate) && candidate >= 0 && candidate <= 36) {
      decimalsNum = candidate;
    }
  }

  return { symbol: symbolStr, name: nameStr, decimals: decimalsNum };
}

/**
 * Create ReserveRow with stable ID and validation
 */
function asReserveRow(
  chainId: number,
  chainName: string,
  marketId: string,
  marketName: string,
  asset: Address,
  symbol: string,
  name: string,
  decimals: number,
  apy: number | null,
  source: 'ui' | 'pool',
): ReserveRow {
  const id = `${chainId}:${asset.toLowerCase()}`;
  return {
    id,
    chainId,
    chainName,
    marketId,
    marketName,
    asset,
    name,
    symbol,
    decimals,
    apy,
    source,
  };
}

/**
 * Add timeout to promise with AbortSignal support
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    throw new Error('Operation aborted');
  }

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timeout = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Operation aborted'));
      });
    }),
  ]);
}

/**
 * Extract currentLiquidityRate from getReserveData result based on ABI structure
 * From IPoolAbi: returns tuple with currentLiquidityRate at index 2
 */
function extractCurrentLiquidityRate(result: unknown): bigint | null {
  try {
    if (result && typeof result === 'object' && 'currentLiquidityRate' in result) {
      const rate = (result as Record<string, unknown>).currentLiquidityRate;
      const rateValue =
        typeof rate === 'bigint' ? rate : typeof rate === 'string' ? BigInt(rate) : null;
      return rateValue;
    }

    if (Array.isArray(result) && result.length > 2) {
      const rate = result[2];
      const rateValue =
        typeof rate === 'bigint' ? rate : typeof rate === 'string' ? BigInt(rate) : null;
      return rateValue;
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Debug] Error extracting currentLiquidityRate:', error);
    }
    return null;
  }
}

// ============================================================================
// Global Cache with TTL and Stale-if-Error
// ============================================================================

type CacheEntry<T> = {
  at: number;
  data: T;
};

const getGlobalCache = (): Map<string, CacheEntry<unknown>> => {
  if (!globalThis.__aaveApyCache) {
    globalThis.__aaveApyCache = new Map();
  }
  return globalThis.__aaveApyCache;
};

declare global {
  var __aaveApyCache: Map<string, CacheEntry<unknown>> | undefined;
}

/**
 * Cached fetcher with stale-if-error strategy
 */
async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cache = getGlobalCache();
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  // Return fresh cache
  if (entry && now - entry.at < ttlMs) {
    return entry.data;
  }

  try {
    // Try to fetch new data
    const data = await fetcher();
    cache.set(key, { at: now, data });
    return data;
  } catch (error) {
    // Stale-if-error: return stale cache if available
    if (entry) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Aave Cache] Using stale data for ${key}:`, error);
      }
      return entry.data;
    }
    // No cache available, re-throw error
    throw error;
  }
}

/**
 * Manually invalidate market cache
 */
export function invalidateMarketCache(chainId: number, marketId: string): void {
  const cache = getGlobalCache();
  const key = `market:${chainId}:${marketId}`;
  cache.delete(key);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetch reserves via UI provider - pure function with validation
 */
async function readUiProviderReserves(
  env: Env,
  market: Market,
  signal?: AbortSignal,
): Promise<ReserveRow[]> {
  const { CHAINS } = createChains(env);
  const cfg = CHAINS[market.chainId];

  if (!cfg || !market.uiPoolDataProvider || !market.addressesProvider) {
    return [];
  }

  const client = getClient(env, market.chainId);
  if (!client) return [];

  try {
    const promise = client.readContract({
      address: market.uiPoolDataProvider,
      abi: UiPoolDataProviderV3Abi,
      functionName: 'getReservesData',
      args: [market.addressesProvider],
    });

    const res = await withTimeout(promise, 8000, signal);
    const [uiReserves] = res;

    if (!Array.isArray(uiReserves) || uiReserves.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Debug] UI Provider returned empty or invalid data for ${market.id}`);
      }
      return [];
    }

    const reserves: ReserveRow[] = [];

    for (const reserve of uiReserves) {
      try {
        const meta = normalizeMeta(reserve.symbol, reserve.name, Number(reserve.decimals));

        let apy: number | null = null;
        try {
          const liquidityRate =
            typeof reserve.liquidityRate === 'bigint'
              ? reserve.liquidityRate
              : BigInt(reserve.liquidityRate || 0);

          apy = liquidityRate > 0n ? computeApyFromRay(liquidityRate) : 0;
          if (!Number.isFinite(apy)) apy = null;
        } catch {
          apy = null;
        }

        reserves.push(
          asReserveRow(
            market.chainId,
            cfg.name,
            market.id,
            market.label,
            reserve.underlyingAsset,
            meta.symbol,
            meta.name,
            meta.decimals,
            apy,
            'ui',
          ),
        );
      } catch {
        continue;
      }
    }

    return reserves;
  } catch {
    return [];
  }
}

/**
 * Fetch reserves via Pool contract - pure function with chunked multicalls
 */
async function readPoolReserves(
  env: Env,
  market: Market,
  signal?: AbortSignal,
): Promise<ReserveRow[]> {
  const { CHAINS } = createChains(env);
  const cfg = CHAINS[market.chainId];

  if (!cfg) return [];

  const client = getClient(env, market.chainId);
  if (!client) return [];

  try {
    // Get reserves list
    const promise = client.readContract({
      address: market.pool,
      abi: IPoolAbi,
      functionName: 'getReservesList',
    });

    const assets = await withTimeout(promise, 8000, signal);
    if (!Array.isArray(assets) || assets.length === 0) return [];

    // Process in chunks of 50 to avoid RPC limits
    const chunks = chunkArray(assets, 50);
    const allReserves: ReserveRow[] = [];

    for (const chunk of chunks) {
      if (signal?.aborted) break;

      try {
        const reserveCalls = chunk.map((asset) => ({
          address: market.pool,
          abi: IPoolAbi,
          functionName: 'getReserveData',
          args: [asset],
        }));

        const metaCalls = chunk.flatMap((asset) => [
          { address: asset, abi: ERC20Abi, functionName: 'symbol' },
          { address: asset, abi: ERC20Abi, functionName: 'name' },
          { address: asset, abi: ERC20Abi, functionName: 'decimals' },
        ]);

        const [reserveResults, metaResults] = await Promise.all([
          client.multicall({
            contracts: reserveCalls,
            allowFailure: true,
            batchSize: 50,
          }),
          client.multicall({
            contracts: metaCalls,
            allowFailure: true,
            batchSize: 50,
          }),
        ]);

        // Process results for this chunk
        for (let i = 0; i < chunk.length; i++) {
          const asset = chunk[i];
          const reserveResult = reserveResults[i];
          const symbolResult = metaResults[i * 3 + 0];
          const nameResult = metaResults[i * 3 + 1];
          const decimalsResult = metaResults[i * 3 + 2];

          let apy: number | null = null;
          if (reserveResult.status === 'success') {
            const liquidityRate = extractCurrentLiquidityRate(reserveResult.result);
            if (liquidityRate !== null && liquidityRate > 0n) {
              try {
                const computedApy = computeApyFromRay(liquidityRate);
                apy = Number.isFinite(computedApy) ? computedApy : null;
              } catch {
                apy = null;
              }
            } else if (liquidityRate === 0n) {
              apy = 0;
            }
          }

          const symbol = symbolResult.status === 'success' ? symbolResult.result : undefined;
          const name = nameResult.status === 'success' ? nameResult.result : undefined;
          const decimals = decimalsResult.status === 'success' ? decimalsResult.result : undefined;

          const meta = normalizeMeta(symbol, name, decimals);

          allReserves.push(
            asReserveRow(
              market.chainId,
              cfg.name,
              market.id,
              market.label,
              asset,
              meta.symbol,
              meta.name,
              meta.decimals,
              apy,
              'pool',
            ),
          );
        }
      } catch {
        for (const asset of chunk) {
          const meta = normalizeMeta(undefined, undefined, undefined);
          allReserves.push(
            asReserveRow(
              market.chainId,
              cfg.name,
              market.id,
              market.label,
              asset,
              meta.symbol,
              meta.name,
              meta.decimals,
              null,
              'pool',
            ),
          );
        }
      }
    }

    return allReserves;
  } catch {
    return [];
  }
}

// ============================================================================
// Sorting and Main Orchestrators
// ============================================================================

/**
 * Sort reserves with stable sorting rules:
 * 1. APY desc (null APY goes to end)
 * 2. Symbol asc (tie-breaker)
 * 3. Asset address asc (final tie-breaker)
 */
function sortReserves(reserves: ReserveRow[]): ReserveRow[] {
  return reserves.slice().sort((a, b) => {
    // APY desc, but put null values at end
    if (a.apy === null && b.apy === null) {
      // Both null, sort by symbol
      return a.symbol.localeCompare(b.symbol);
    }
    if (a.apy === null) return 1; // a goes after b
    if (b.apy === null) return -1; // b goes after a

    // Both have APY values
    if (a.apy !== b.apy) {
      return b.apy - a.apy; // desc
    }

    // APY tie, sort by symbol
    const symbolCmp = a.symbol.localeCompare(b.symbol);
    if (symbolCmp !== 0) return symbolCmp;

    // Symbol tie, sort by asset address
    return a.asset.toLowerCase().localeCompare(b.asset.toLowerCase());
  });
}

/**
 * Get market reserves with fallback strategy: UI Provider -> Pool
 * Default TTL: 30-60s (45s average)
 */
export async function getMarketReservesApy(
  env: Env,
  market: Market,
  ttlMs = 45_000,
  signal?: AbortSignal,
): Promise<ReserveRow[]> {
  const key = `market:${market.chainId}:${market.id}`;

  return cached(key, ttlMs, async () => {
    if (signal?.aborted) return [];

    let reserves: ReserveRow[] = [];

    // Strategy 1: Try UI Provider first
    if (market.uiPoolDataProvider && market.addressesProvider) {
      try {
        reserves = await readUiProviderReserves(env, market, signal);
        if (reserves.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Aave] UI Provider success for ${market.id}: ${reserves.length} reserves`);
          }
          return sortReserves(reserves);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Aave] UI Provider failed for ${market.id}, falling back to Pool:`, error);
        }
      }
    }

    // Strategy 2: Fallback to Pool
    try {
      reserves = await readPoolReserves(env, market, signal);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Aave] Pool success for ${market.id}: ${reserves.length} reserves`);
      }
      return sortReserves(reserves);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Aave] Pool failed for ${market.id}:`, error);
      }
      return [];
    }
  });
}

/**
 * Get all markets APY with concurrent processing
 */
export async function getAllMarketsApy(
  env: Env,
  markets: Market[],
  ttlMs = 45_000,
  signal?: AbortSignal,
): Promise<ReserveRow[]> {
  if (signal?.aborted) return [];

  try {
    const promises = markets.map((market) => getMarketReservesApy(env, market, ttlMs, signal));

    const results = await Promise.all(promises);

    const allReserves = results.flat();
    return sortReserves(allReserves);
  } catch {
    return [];
  }
}
