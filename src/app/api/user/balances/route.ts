import { type Address } from 'viem';
import { NextResponse } from 'next/server';
import { createAllMarketClients, getMarketByChainId } from '@/config/aave-config';
import { getValidatedEnv } from '@/config/env';
import { formatTokenBalance } from '@/lib/contract-utils';
import { createErrorResponse, createValidationErrorResponse } from '@/lib/error';
import { fetchTokenBalances } from '@/lib/multicall';

export type TokenBalance = {
  chainId: number;
  asset: Address;
  balance: string;
  formatted: string;
  error?: boolean;
};

function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function fetchUserBalances(
  userAddress: Address,
  assets: Array<{ chainId: number; asset: Address }>,
): Promise<TokenBalance[]> {
  const env = getValidatedEnv();
  const clients = createAllMarketClients(env);

  const balances: TokenBalance[] = [];
  const criticalErrors: Error[] = [];

  const assetsByChain = new Map<number, Address[]>();
  for (const { chainId, asset } of assets) {
    if (!assetsByChain.has(chainId)) {
      assetsByChain.set(chainId, []);
    }
    assetsByChain.get(chainId)!.push(asset);
  }

  await Promise.all(
    Array.from(assetsByChain.entries()).map(async ([chainId, chainAssets]) => {
      const client = clients[chainId];
      const market = getMarketByChainId(chainId);

      if (!client || !market) {
        console.warn(`No client or market config for chain ${chainId}`);
        return;
      }

      try {
        const balancesData = await fetchTokenBalances(client, userAddress, chainAssets);

        for (const asset of chainAssets) {
          const data = balancesData.get(asset);

          if (data) {
            balances.push({
              chainId,
              asset,
              balance: data.balance.toString(),
              formatted: formatTokenBalance(data.balance, data.decimals),
            });
          } else {
            balances.push({
              chainId,
              asset,
              balance: '0',
              formatted: 'N/A',
              error: true,
            });
          }
        }
      } catch (error) {
        console.error(`Multicall failed for chain ${chainId}:`, error);

        const err = error as Error;
        const errorStr = err.toString().toLowerCase();

        if (errorStr.includes('status: 403') || errorStr.includes('status: 401')) {
          criticalErrors.push(err);
        }

        for (const asset of chainAssets) {
          balances.push({
            chainId,
            asset,
            balance: '0',
            formatted: 'N/A',
            error: true,
          });
        }
      }
    }),
  );

  if (criticalErrors.length > 0 && balances.filter((b) => !b.error).length === 0) {
    throw criticalErrors[0];
  }

  return balances;
}

type BalancesRequest = {
  address: string;
  assets: Array<{ chainId: number; asset: string }>;
};

export async function POST(request: Request) {
  try {
    const body: BalancesRequest = await request.json();

    // Validate request body
    if (!body.address || !isValidAddress(body.address)) {
      const { response, status } = createValidationErrorResponse(
        'Invalid or missing wallet address.',
      );
      return NextResponse.json(response, { status });
    }

    if (!Array.isArray(body.assets)) {
      const { response, status } = createValidationErrorResponse('Assets must be an array.');
      return NextResponse.json(response, { status });
    }

    if (body.assets.length === 0) {
      return NextResponse.json({ balances: [] });
    }

    // Validate and parse assets
    const assets: Array<{ chainId: number; asset: Address }> = [];
    for (const assetData of body.assets) {
      if (
        typeof assetData.chainId === 'number' &&
        typeof assetData.asset === 'string' &&
        isValidAddress(assetData.asset)
      ) {
        assets.push({
          chainId: assetData.chainId,
          asset: assetData.asset,
        });
      }
    }

    if (assets.length === 0) {
      return NextResponse.json({ balances: [] });
    }

    const balances = await fetchUserBalances(body.address, assets);

    return NextResponse.json({ balances });
  } catch (error) {
    console.error('Balances API Error:', error);

    const { response, status } = createErrorResponse(error);

    return NextResponse.json(response, { status });
  }
}

export const revalidate = 0; // Don't cache
