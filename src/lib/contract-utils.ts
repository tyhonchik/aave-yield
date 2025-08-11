import { formatUnits, type Address, type PublicClient } from 'viem';
import { PoolABI, type GetReservesListResult } from './abis/pool';

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
