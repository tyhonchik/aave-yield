import { AaveV3Base, AaveV3Ethereum, AaveV3Polygon } from '@bgd-labs/aave-address-book';
import type { Address } from 'viem';
import { base, mainnet, polygon } from 'viem/chains';

export type Market = {
  id: string;
  label: string;
  chainId: number;
  pool: Address;
  addressesProvider?: Address;
  uiPoolDataProvider?: Address;
  icon?: string;
};

export const MARKETS: Market[] = [
  {
    id: 'eth-v3',
    label: 'Aave V3 Ethereum',
    chainId: mainnet.id,
    pool: AaveV3Ethereum.POOL,
    addressesProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  },
  {
    id: 'poly-v3',
    label: 'Aave V3 Polygon',
    chainId: polygon.id,
    pool: AaveV3Polygon.POOL,
    addressesProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Polygon.UI_POOL_DATA_PROVIDER,
  },
  {
    id: 'base-v3',
    label: 'Aave V3 Base',
    chainId: base.id,
    pool: AaveV3Base.POOL,
    addressesProvider: AaveV3Base.POOL_ADDRESSES_PROVIDER,
    uiPoolDataProvider: AaveV3Base.UI_POOL_DATA_PROVIDER,
  },
];
