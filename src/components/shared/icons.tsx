'use client';

import type { Web3IconProps } from '@bgd-labs/react-web3-icons';
import dynamic from 'next/dynamic';

type ChainIconProps = { chainId: number; size?: number; className?: string };
type TokenIconProps = {
  chainId?: number;
  symbol?: string;
  size?: number;
  className?: string;
};

const Web3IconDynamic = dynamic<Web3IconProps>(
  () => import('@bgd-labs/react-web3-icons').then((m) => m.Web3Icon),
  { ssr: false },
);

export function ChainIndicator({ chainId, size = 16, className }: ChainIconProps) {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 self-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <Web3IconDynamic chainId={chainId} width={size} height={size} aria-hidden />
    </div>
  );
}

export function TokenIndicator({ chainId, symbol, size = 28, className }: TokenIconProps) {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-md bg-background text-xs shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <Web3IconDynamic
        chainId={chainId}
        symbol={symbol}
        width={size}
        height={size}
        aria-hidden
        className="rounded-md"
      />
    </div>
  );
}
