import { type Address } from 'viem';
import { NextResponse } from 'next/server';
import { createAllMarketClients, getEnabledMarkets } from '@/config/aave-config';
import { getValidatedEnv } from '@/config/env';
import { calculateApy, getReservesList } from '@/lib/contract-utils';
import { AppError, createErrorResponse } from '@/lib/error';
import { fetchReservesData, fetchTokensMetadata } from '@/lib/multicall';

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

async function fetchMarketData(): Promise<{ markets: MarketReserve[]; errors: MarketError[] }> {
  const env = getValidatedEnv();
  const enabledMarkets = getEnabledMarkets();
  const clients = createAllMarketClients(env);

  const allReserves: MarketReserve[] = [];
  const marketErrors: MarketError[] = [];

  // Process each market in parallel
  await Promise.all(
    enabledMarkets.map(async (market) => {
      const client = clients[market.chainId];
      if (!client) {
        marketErrors.push({
          id: `market-${market.chainId}`,
          chainId: market.chainId,
          chainName: market.chainName,
          marketName: market.label,
          error: 'No client available for this chain',
          retryable: true,
        });
        return;
      }

      try {
        const reserves = await getReservesList(client, market.pool);
        const assets = Array.from(reserves);

        const [reservesData, tokensMetadata] = await Promise.all([
          fetchReservesData(client, market.pool, assets),
          fetchTokensMetadata(client, assets),
        ]);

        for (const asset of assets) {
          const reserveData = reservesData.get(asset);
          const metadata = tokensMetadata.get(asset);

          if (!reserveData || !metadata) {
            marketErrors.push({
              id: `asset-${market.chainId}-${asset}`,
              chainId: market.chainId,
              chainName: market.chainName,
              marketName: `${market.label} - ${asset.slice(0, 6)}...${asset.slice(-4)}`,
              error: 'Failed to fetch asset data',
              retryable: true,
            });
            continue;
          }

          allReserves.push({
            id: `${market.chainId}-${asset}`,
            chainId: market.chainId,
            chainName: market.chainName,
            marketName: market.label,
            asset,
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: metadata.decimals,
            apy: calculateApy(reserveData.currentLiquidityRate),
          });
        }
      } catch (error) {
        console.error(`Market ${market.label} failed:`, error);

        const appError = AppError.fromUnknown(error);

        marketErrors.push({
          id: `market-${market.chainId}`,
          chainId: market.chainId,
          chainName: market.chainName,
          marketName: market.label,
          error: appError.userMessage,
          retryable: appError.retryable,
        });
      }
    }),
  );

  if (allReserves.length === 0 && marketErrors.length > 0) {
    throw AppError.server('No market data available');
  }

  allReserves.sort((a, b) => b.apy - a.apy);

  return { markets: allReserves, errors: marketErrors };
}

export async function GET() {
  try {
    const result = await fetchMarketData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Markets API Error:', error);

    const { response, status } = createErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}

export const revalidate = 0; // Don't cache
