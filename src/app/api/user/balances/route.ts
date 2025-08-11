import { type Address } from 'viem';
import { NextResponse } from 'next/server';
import { createAllMarketClients, getMarketByChainId } from '@/config/aave-config';
import { getValidatedEnv } from '@/config/env';
import { formatTokenBalance, getTokenBalance, getTokenDecimals } from '@/lib/contract-utils';

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

      await Promise.all(
        chainAssets.map(async (asset) => {
          try {
            const [balance, decimals] = await Promise.all([
              getTokenBalance(client, asset, userAddress),
              getTokenDecimals(client, asset),
            ]);

            const formatted = formatTokenBalance(balance, decimals);

            balances.push({
              chainId,
              asset,
              balance: balance.toString(),
              formatted,
            });
          } catch (error) {
            console.error(`Failed to fetch balance for ${asset} on chain ${chainId}:`, error);

            balances.push({
              chainId,
              asset,
              balance: '0',
              formatted: 'N/A',
              error: true,
            });
          }
        }),
      );
    }),
  );

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
      return NextResponse.json({ error: 'Invalid or missing address' }, { status: 400 });
    }

    if (!Array.isArray(body.assets)) {
      return NextResponse.json({ error: 'Assets must be an array' }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}

export const revalidate = 0; // Don't cache
