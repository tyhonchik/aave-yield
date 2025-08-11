import { createConfig } from 'wagmi';
import { createWagmiTransports, getWagmiChains } from './aave-config';
import type { Env } from './env';

export function createWagmiConfig(env: Env) {
  const chains = getWagmiChains();
  const transports = createWagmiTransports(env);

  return createConfig({
    chains,
    transports,
    multiInjectedProviderDiscovery: true,
    ssr: false,
  });
}
