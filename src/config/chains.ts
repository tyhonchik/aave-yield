import { createPublicClient, http, type PublicClient } from 'viem';
import type { Chain, Transport } from 'viem';
import { base, mainnet, polygon } from 'viem/chains';
import type { Env } from './env';

export type SupportedChain = {
  id: number;
  name: string;
  nativeSymbol: string;
  explorerBaseUrl: string;
  enabled: boolean;
  chain: Chain;
  transport: Transport;
};

export function createChains(env: Env) {
  const CHAINS: Record<number, SupportedChain> = {
    [mainnet.id]: {
      id: mainnet.id,
      name: 'Ethereum',
      nativeSymbol: 'ETH',
      explorerBaseUrl: 'https://etherscan.io',
      enabled: true,
      chain: mainnet,
      transport: http(env.RPC_MAINNET, { batch: true }),
    },
    [polygon.id]: {
      id: polygon.id,
      name: 'Polygon',
      nativeSymbol: 'MATIC',
      explorerBaseUrl: 'https://polygonscan.com',
      enabled: true,
      chain: polygon,
      transport: http(env.RPC_POLYGON, { batch: true }),
    },
    [base.id]: {
      id: base.id,
      name: 'Base',
      nativeSymbol: 'ETH',
      explorerBaseUrl: 'https://basescan.org',
      enabled: true,
      chain: base,
      transport: http(env.RPC_BASE, { batch: true }),
    },
  };

  const ENABLED_CHAINS = Object.values(CHAINS)
    .filter((c) => c.enabled)
    .map((c) => c.chain);

  function getPublicClient(chainId: number): PublicClient {
    const cfg = CHAINS[chainId];
    if (!cfg) throw new Error(`Unsupported chainId: ${chainId}`);
    return createPublicClient({ chain: cfg.chain, transport: cfg.transport });
  }

  return { CHAINS, ENABLED_CHAINS, getPublicClient };
}
