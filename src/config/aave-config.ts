import { AaveV3Base, AaveV3Ethereum, AaveV3Polygon } from '@bgd-labs/aave-address-book';
import { createPublicClient, http, type Address, type PublicClient } from 'viem';
import { base, mainnet, polygon, type Chain } from 'viem/chains';
import type { Env } from './env';

// Main config for all chains and markets
export type AaveMarketConfig = {
  // Main information
  id: string;
  label: string;

  // Chain information
  chainId: number;
  chain: Chain;
  chainName: string;
  nativeSymbol: string;
  explorerBaseUrl: string;
  getRpcUrl: (env: Env) => string;

  // Aave contracts
  pool: Address;
  addressesProvider?: Address;
  uiPoolDataProvider?: Address;

  // UI
  icon?: string;
  enabled: boolean;
};

/**
 * Configuration for all supported markets
 * To add a new network:
 * 1. Add new RPC URL in env.ts
 * 2. Add new object here
 * 3. Import chain from viem/chains
 * 4. Add contract addresses from @bgd-labs/aave-address-book
 */
export const AAVE_MARKETS: AaveMarketConfig[] = [
  {
    id: 'eth-v3',
    label: 'Aave V3 Ethereum',
    chainId: mainnet.id,
    chain: mainnet,
    chainName: 'Ethereum',
    nativeSymbol: 'ETH',
    explorerBaseUrl: 'https://etherscan.io',
    getRpcUrl: (env) => env.RPC_MAINNET,
    pool: AaveV3Ethereum.POOL,
    addressesProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
    enabled: true,
  },
  {
    id: 'poly-v3',
    label: 'Aave V3 Polygon',
    chainId: polygon.id,
    chain: polygon,
    chainName: 'Polygon',
    nativeSymbol: 'MATIC',
    explorerBaseUrl: 'https://polygonscan.com',
    getRpcUrl: (env) => env.RPC_POLYGON,
    pool: AaveV3Polygon.POOL,
    addressesProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Polygon.UI_POOL_DATA_PROVIDER,
    enabled: true,
  },
  {
    id: 'base-v3',
    label: 'Aave V3 Base',
    chainId: base.id,
    chain: base,
    chainName: 'Base',
    nativeSymbol: 'ETH',
    explorerBaseUrl: 'https://basescan.org',
    getRpcUrl: (env) => env.RPC_BASE,
    pool: AaveV3Base.POOL,
    addressesProvider: AaveV3Base.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Base.UI_POOL_DATA_PROVIDER,
    enabled: true,
  },
] as const;

// Utility functions
export function getEnabledMarkets(): AaveMarketConfig[] {
  return AAVE_MARKETS.filter((market) => market.enabled);
}

export function getMarketById(id: string): AaveMarketConfig | undefined {
  return AAVE_MARKETS.find((market) => market.id === id);
}

export function getMarketByChainId(chainId: number): AaveMarketConfig | undefined {
  return AAVE_MARKETS.find((market) => market.chainId === chainId);
}

export function getSupportedChainIds(): number[] {
  return getEnabledMarkets().map((market) => market.chainId);
}

export function createMarketClient(market: AaveMarketConfig, env: Env): PublicClient {
  return createPublicClient({
    chain: market.chain,
    transport: http(market.getRpcUrl(env), { batch: true }),
  });
}

export function createAllMarketClients(env: Env): Record<number, PublicClient> {
  const clients: Record<number, PublicClient> = {};

  for (const market of getEnabledMarkets()) {
    clients[market.chainId] = createMarketClient(market, env);
  }

  return clients;
}

export function getWagmiChains(): readonly [Chain, ...Chain[]] {
  const enabledMarkets = getEnabledMarkets();
  if (enabledMarkets.length === 0) {
    throw new Error('No enabled markets found');
  }
  return enabledMarkets.map((market) => market.chain) as unknown as readonly [Chain, ...Chain[]];
}

export function createWagmiTransports(env: Env) {
  const transports: Record<number, ReturnType<typeof http>> = {};

  for (const market of getEnabledMarkets()) {
    transports[market.chainId] = http(market.getRpcUrl(env), { batch: true });
  }

  return transports;
}
