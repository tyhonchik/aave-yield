import { type Address, type PublicClient } from 'viem';
import { ERC20ABI } from './abis/erc20';
import { PoolABI, type GetReserveDataResult } from './abis/pool';

export type TokenMetadata = {
  symbol: string;
  name: string;
  decimals: number;
};

// In-memory cache
const metadataCache = new Map<string, TokenMetadata>();

function getCacheKey(chainId: number | undefined, address: Address): string {
  return `${chainId ?? 0}-${address.toLowerCase()}`;
}

/**
 * Fetches token metadata for multiple tokens (multicall + caching)
 */
export async function fetchTokensMetadata(
  client: PublicClient,
  addresses: Address[],
): Promise<Map<Address, TokenMetadata>> {
  const chainId = client.chain?.id;
  const result = new Map<Address, TokenMetadata>();
  const missing: Address[] = [];

  // Check cache first
  for (const address of addresses) {
    const cached = metadataCache.get(getCacheKey(chainId, address));
    if (cached) {
      result.set(address, cached);
    } else {
      missing.push(address);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  // Build multicall for missing tokens
  const contracts = missing.flatMap((address) => [
    { address, abi: ERC20ABI, functionName: 'symbol' as const },
    { address, abi: ERC20ABI, functionName: 'name' as const },
    { address, abi: ERC20ABI, functionName: 'decimals' as const },
  ]);

  const responses = await client.multicall({ contracts, allowFailure: true });

  // Process responses and update cache
  for (let i = 0; i < missing.length; i++) {
    const address = missing[i];
    const [symbolRes, nameRes, decimalsRes] = responses.slice(i * 3, i * 3 + 3);

    const metadata: TokenMetadata = {
      symbol: symbolRes.status === 'success' ? String(symbolRes.result) : 'UNKNOWN',
      name: nameRes.status === 'success' ? String(nameRes.result) : 'Unknown Token',
      decimals:
        decimalsRes.status === 'success' && Number(decimalsRes.result) <= 36
          ? Number(decimalsRes.result)
          : 18,
    };

    metadataCache.set(getCacheKey(chainId, address), metadata);
    result.set(address, metadata);
  }

  return result;
}

/**
 * Fetches reserve data for multiple assets (multicall)
 */
export async function fetchReservesData(
  client: PublicClient,
  poolAddress: Address,
  assets: Address[],
): Promise<Map<Address, GetReserveDataResult>> {
  const contracts = assets.map((asset) => ({
    address: poolAddress,
    abi: PoolABI,
    functionName: 'getReserveData' as const,
    args: [asset] as const,
  }));

  const responses = await client.multicall({ contracts, allowFailure: true });
  const result = new Map<Address, GetReserveDataResult>();

  for (let i = 0; i < assets.length; i++) {
    const res = responses[i];
    if (res.status === 'success' && res.result) {
      result.set(assets[i], res.result as GetReserveDataResult);
    }
  }

  return result;
}

/**
 * Fetches user balances for multiple tokens (multicall)
 */
export async function fetchTokenBalances(
  client: PublicClient,
  userAddress: Address,
  tokenAddresses: Address[],
): Promise<Map<Address, { balance: bigint; decimals: number }>> {
  const contracts = tokenAddresses.flatMap((address) => [
    {
      address,
      abi: ERC20ABI,
      functionName: 'balanceOf' as const,
      args: [userAddress] as const,
    },
    { address, abi: ERC20ABI, functionName: 'decimals' as const },
  ]);

  const responses = await client.multicall({ contracts, allowFailure: true });
  const result = new Map<Address, { balance: bigint; decimals: number }>();

  for (let i = 0; i < tokenAddresses.length; i++) {
    const address = tokenAddresses[i];
    const [balanceRes, decimalsRes] = responses.slice(i * 2, i * 2 + 2);

    if (balanceRes.status === 'success' && decimalsRes.status === 'success') {
      result.set(address, {
        balance: balanceRes.result as bigint,
        decimals: Number(decimalsRes.result),
      });
    }
  }

  return result;
}
