import { type Address } from 'viem';
import { NextResponse } from 'next/server';
import { createAllMarketClients, getEnabledMarkets } from '@/config/aave-config';
import { getValidatedEnv } from '@/config/env';
import {
  calculateApy,
  getReserveData,
  getReservesList,
  getTokenDecimals,
  getTokenName,
  getTokenSymbol,
} from '@/lib/contract-utils';

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

async function fetchMarketData() {
  const env = getValidatedEnv();
  const enabledMarkets = getEnabledMarkets();
  const clients = createAllMarketClients(env);

  const allReserves: MarketReserve[] = [];

  // Process each market in parallel
  await Promise.all(
    enabledMarkets.map(async (market) => {
      const client = clients[market.chainId];
      if (!client) return;

      try {
        const reserves = await getReservesList(client, market.pool);

        // Process each reserve
        await Promise.all(
          reserves.map(async (asset) => {
            try {
              const [reserveData, symbol, name, decimals] = await Promise.all([
                getReserveData(client, market.pool, asset),
                getTokenSymbol(client, asset),
                getTokenName(client, asset),
                getTokenDecimals(client, asset),
              ]);

              const apy = calculateApy(reserveData.currentLiquidityRate);

              allReserves.push({
                id: `${market.chainId}-${asset}`,
                chainId: market.chainId,
                chainName: market.chainName,
                marketName: market.label,
                asset,
                symbol,
                name,
                decimals,
                apy,
              });
            } catch (error) {
              console.error(`Failed to process asset ${asset} in ${market.label}:`, error);
            }
          }),
        );
      } catch (error) {
        console.error(`Failed to fetch reserves for ${market.label}:`, error);
      }
    }),
  );

  allReserves.sort((a, b) => b.apy - a.apy);

  return allReserves;
}

export async function GET() {
  try {
    const markets = await fetchMarketData();
    return NextResponse.json({ markets });
  } catch (error) {
    console.error('Markets API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}

export const revalidate = 0; // Don't cache
