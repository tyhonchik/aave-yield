'use client';

import { WagmiProvider as WProvider } from 'wagmi';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { Env } from '@/config/env';
import { createWagmiConfig } from '@/config/wagmi';

export function WagmiProvider({ children, env }: { children: ReactNode; env: Env }) {
  const config = useMemo(() => createWagmiConfig(env), [env]);
  return <WProvider config={config}>{children}</WProvider>;
}
