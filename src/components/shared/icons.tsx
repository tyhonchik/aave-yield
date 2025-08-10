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
    <Web3IconDynamic
      chainId={chainId}
      width={size}
      height={size}
      className={className}
      aria-hidden
    />
  );
}

export function TokenIndicator({ chainId, symbol, size = 18, className }: TokenIconProps) {
  return (
    <Web3IconDynamic
      chainId={chainId}
      symbol={symbol}
      width={size}
      height={size}
      className={className}
      aria-hidden
    />
  );
}
