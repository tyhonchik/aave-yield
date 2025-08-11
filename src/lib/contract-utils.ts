import { formatUnits, type Address, type PublicClient } from 'viem';
import { ERC20ABI } from './abis/erc20';
import { PoolABI, type GetReserveDataResult, type GetReservesListResult } from './abis/pool';

// Type-safe wrappers for contract calls

export async function getReservesList(
  client: PublicClient,
  poolAddress: Address,
): Promise<GetReservesListResult> {
  const result = await client.readContract({
    address: poolAddress,
    abi: PoolABI,
    functionName: 'getReservesList',
  });

  if (!Array.isArray(result)) {
    throw new Error('getReservesList returned invalid data');
  }

  return result as GetReservesListResult;
}

export async function getReserveData(
  client: PublicClient,
  poolAddress: Address,
  assetAddress: Address,
): Promise<GetReserveDataResult> {
  const result = await client.readContract({
    address: poolAddress,
    abi: PoolABI,
    functionName: 'getReserveData',
    args: [assetAddress],
  });

  if (!result || typeof result !== 'object') {
    throw new Error('getReserveData returned invalid data');
  }

  return result as GetReserveDataResult;
}

export async function getTokenSymbol(client: PublicClient, tokenAddress: Address): Promise<string> {
  try {
    const result = await client.readContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'symbol',
    });

    if (typeof result !== 'string') {
      return 'UNKNOWN';
    }

    return result;
  } catch {
    return 'UNKNOWN';
  }
}

export async function getTokenName(client: PublicClient, tokenAddress: Address): Promise<string> {
  try {
    const result = await client.readContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'name',
    });

    if (typeof result !== 'string') {
      return 'Unknown Token';
    }

    return result;
  } catch {
    return 'Unknown Token';
  }
}

export async function getTokenDecimals(
  client: PublicClient,
  tokenAddress: Address,
): Promise<number> {
  try {
    const result = await client.readContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'decimals',
    });

    if (typeof result !== 'number' || result < 0 || result > 36) {
      return 18; // Fallback to 18 decimals
    }

    return result;
  } catch {
    return 18;
  }
}

export async function getTokenBalance(
  client: PublicClient,
  tokenAddress: Address,
  userAddress: Address,
): Promise<bigint> {
  try {
    const result = await client.readContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    if (typeof result !== 'bigint') {
      return 0n;
    }

    return result;
  } catch {
    return 0n;
  }
}

// Utility functions
export function calculateApy(currentLiquidityRate: bigint): number {
  if (currentLiquidityRate === 0n) {
    return 0;
  }

  try {
    // Convert from RAY (27 decimals) to percentage
    const rate = Number(formatUnits(currentLiquidityRate, 27));
    const apy = rate * 100;

    // Sanity check
    if (!Number.isFinite(apy) || apy < 0 || apy > 1000) {
      return 0;
    }

    return apy;
  } catch {
    return 0;
  }
}

export function formatTokenBalance(balance: bigint, decimals: number): string {
  try {
    return formatUnits(balance, decimals);
  } catch {
    return '0';
  }
}
