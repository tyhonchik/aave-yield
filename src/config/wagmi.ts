import type { Chain } from 'viem';
import { createConfig } from 'wagmi';
import { createChains } from './chains';
import type { Env } from './env';

export function createWagmiConfig(env: Env) {
  const { ENABLED_CHAINS, CHAINS } = createChains(env);

  const chainsTuple = ENABLED_CHAINS as unknown as readonly [Chain, ...Chain[]];

  return createConfig({
    chains: chainsTuple,
    transports: Object.fromEntries(Object.values(CHAINS).map((c) => [c.id, c.transport])),
    multiInjectedProviderDiscovery: true,
    ssr: false,
  });
}
