import type { PublicClient } from 'viem';
import { mainnet, polygon } from 'viem/chains';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import type { MarketError } from '../route';

// Mock all external dependencies
vi.mock('@/config/aave-config', () => ({
  getEnabledMarkets: vi.fn(() => [
    {
      chainId: 1,
      chainName: 'Ethereum',
      label: 'Ethereum V3',
      pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    },
  ]),
  createAllMarketClients: vi.fn(() => ({
    1: {
      readContract: vi.fn(),
    },
  })),
}));

vi.mock('@/config/env', () => ({
  getValidatedEnv: vi.fn(() => ({
    ALCHEMY_API_KEY: 'test_key',
  })),
}));

vi.mock('@/lib/contract-utils', () => ({
  getReservesList: vi.fn(),
  calculateApy: vi.fn(),
}));

vi.mock('@/lib/multicall', () => ({
  fetchReservesData: vi.fn(),
  fetchTokensMetadata: vi.fn(),
}));

describe('GET /api/aave/markets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return market data in correct format when everything succeeds', async () => {
    const { getReservesList, calculateApy } = await import('@/lib/contract-utils');
    const { fetchReservesData, fetchTokensMetadata } = await import('@/lib/multicall');

    // Mock successful responses
    vi.mocked(getReservesList).mockResolvedValue(['0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C']); // USDC

    vi.mocked(fetchReservesData).mockResolvedValue(
      new Map([
        [
          '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C',
          {
            configuration: 0n,
            liquidityIndex: 0n,
            variableBorrowIndex: 0n,
            currentLiquidityRate: 50000000000000000000000000n,
            currentVariableBorrowRate: 0n,
            currentStableBorrowRate: 0n,
            lastUpdateTimestamp: 0,
            id: 1,
            aTokenAddress: '0x' as const,
            stableDebtTokenAddress: '0x' as const,
            variableDebtTokenAddress: '0x' as const,
            interestRateStrategyAddress: '0x' as const,
            accruedToTreasury: 0n,
            unbacked: 0n,
            isolationModeTotalDebt: 0n,
          },
        ],
      ]),
    );

    vi.mocked(fetchTokensMetadata).mockResolvedValue(
      new Map([
        [
          '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C',
          { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        ],
      ]),
    );

    vi.mocked(calculateApy).mockReturnValue(5.0);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('markets');
    expect(data).toHaveProperty('errors');
    expect(Array.isArray(data.markets)).toBe(true);
    expect(Array.isArray(data.errors)).toBe(true);

    if (data.markets.length > 0) {
      const market = data.markets[0];
      expect(market).toHaveProperty('id');
      expect(market).toHaveProperty('chainId');
      expect(market).toHaveProperty('symbol');
      expect(market).toHaveProperty('apy');
      expect(typeof market.apy).toBe('number');
    }
  });

  it('should handle partial failures gracefully (some markets fail, others succeed)', async () => {
    const { getEnabledMarkets, createAllMarketClients } = await import('@/config/aave-config');
    const { getReservesList, calculateApy } = await import('@/lib/contract-utils');
    const { fetchReservesData, fetchTokensMetadata } = await import('@/lib/multicall');

    // Mock two markets
    vi.mocked(getEnabledMarkets).mockReturnValue([
      {
        id: 'ethereum-v3',
        label: 'Ethereum V3',
        chainId: 1,
        chain: mainnet,
        chainName: 'Ethereum',
        nativeSymbol: 'ETH',
        explorerBaseUrl: 'https://etherscan.io',
        getRpcUrl: () => 'https://eth-mainnet.alchemyapi.io/v2/test',
        pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        enabled: true,
      },
      {
        id: 'polygon-v3',
        label: 'Polygon V3',
        chainId: 137,
        chain: polygon,
        chainName: 'Polygon',
        nativeSymbol: 'MATIC',
        explorerBaseUrl: 'https://polygonscan.com',
        getRpcUrl: () => 'https://polygon-mainnet.alchemyapi.io/v2/test',
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        enabled: true,
      },
    ]);

    // Mock clients for both chains
    vi.mocked(createAllMarketClients).mockReturnValue({
      1: { readContract: vi.fn() } as Partial<PublicClient> as PublicClient,
      137: { readContract: vi.fn() } as Partial<PublicClient> as PublicClient,
    });

    // First market succeeds, second market fails
    vi.mocked(getReservesList)
      .mockResolvedValueOnce(['0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C'])
      .mockRejectedValueOnce(new Error('Network timeout'));

    // Mock successful data for first market
    vi.mocked(fetchReservesData).mockResolvedValueOnce(
      new Map([
        [
          '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C',
          {
            configuration: 0n,
            liquidityIndex: 0n,
            variableBorrowIndex: 0n,
            currentLiquidityRate: 50000000000000000000000000n,
            currentVariableBorrowRate: 0n,
            currentStableBorrowRate: 0n,
            lastUpdateTimestamp: 0,
            id: 1,
            aTokenAddress: '0x' as const,
            stableDebtTokenAddress: '0x' as const,
            variableDebtTokenAddress: '0x' as const,
            interestRateStrategyAddress: '0x' as const,
            accruedToTreasury: 0n,
            unbacked: 0n,
            isolationModeTotalDebt: 0n,
          },
        ],
      ]),
    );

    vi.mocked(fetchTokensMetadata).mockResolvedValueOnce(
      new Map([
        [
          '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C',
          { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        ],
      ]),
    );

    vi.mocked(calculateApy).mockReturnValue(5.0);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.markets.length).toBeGreaterThan(0); // Should have at least one successful market
    expect(data.errors.length).toBeGreaterThan(0); // Should have errors for failed markets

    // Should have error for the failed market
    const errorForPolygon = data.errors.find((err: MarketError) => err.chainId === 137);
    expect(errorForPolygon).toBeDefined();
    expect(errorForPolygon?.retryable).toBe(true);
  });

  it('should return 500 when all markets fail', async () => {
    const { getReservesList } = await import('@/lib/contract-utils');

    // Mock all markets failing
    vi.mocked(getReservesList).mockRejectedValue(new Error('All networks down'));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.retryable).toBe(true);
  });

  it('should sort markets by APY in descending order', async () => {
    const { getEnabledMarkets, createAllMarketClients } = await import('@/config/aave-config');
    const { getReservesList, calculateApy } = await import('@/lib/contract-utils');
    const { fetchReservesData, fetchTokensMetadata } = await import('@/lib/multicall');

    // Reset to single market config for this test
    vi.mocked(getEnabledMarkets).mockReturnValue([
      {
        id: 'ethereum-v3',
        label: 'Ethereum V3',
        chainId: 1,
        chain: mainnet,
        chainName: 'Ethereum',
        nativeSymbol: 'ETH',
        explorerBaseUrl: 'https://etherscan.io',
        getRpcUrl: () => 'https://eth-mainnet.alchemyapi.io/v2/test',
        pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        enabled: true,
      },
    ]);

    vi.mocked(createAllMarketClients).mockReturnValue({
      1: { readContract: vi.fn() } as Partial<PublicClient> as PublicClient,
    });

    // Mock multiple reserves with different APYs
    vi.mocked(getReservesList).mockResolvedValue([
      '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C', // USDC
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ]);

    vi.mocked(fetchReservesData).mockResolvedValue(
      new Map([
        [
          '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C',
          {
            configuration: 0n,
            liquidityIndex: 0n,
            variableBorrowIndex: 0n,
            currentLiquidityRate: 30000000000000000000000000n,
            currentVariableBorrowRate: 0n,
            currentStableBorrowRate: 0n,
            lastUpdateTimestamp: 0,
            id: 1,
            aTokenAddress: '0x' as const,
            stableDebtTokenAddress: '0x' as const,
            variableDebtTokenAddress: '0x' as const,
            interestRateStrategyAddress: '0x' as const,
            accruedToTreasury: 0n,
            unbacked: 0n,
            isolationModeTotalDebt: 0n,
          },
        ],
        [
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          {
            configuration: 0n,
            liquidityIndex: 0n,
            variableBorrowIndex: 0n,
            currentLiquidityRate: 60000000000000000000000000n,
            currentVariableBorrowRate: 0n,
            currentStableBorrowRate: 0n,
            lastUpdateTimestamp: 0,
            id: 2,
            aTokenAddress: '0x' as const,
            stableDebtTokenAddress: '0x' as const,
            variableDebtTokenAddress: '0x' as const,
            interestRateStrategyAddress: '0x' as const,
            accruedToTreasury: 0n,
            unbacked: 0n,
            isolationModeTotalDebt: 0n,
          },
        ],
      ]),
    );

    vi.mocked(fetchTokensMetadata).mockResolvedValue(
      new Map([
        [
          '0xA0b86a33E6411F2C2bCBBf0efB5B8f5EC51d0B3C',
          { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        ],
        [
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
        ],
      ]),
    );

    // USDC: 3% APY, DAI: 6% APY
    vi.mocked(calculateApy).mockReturnValueOnce(3.0).mockReturnValueOnce(6.0);

    const response = await GET();
    const data = await response.json();

    expect(data.markets).toHaveLength(2);
    expect(data.markets[0].symbol).toBe('DAI'); // Higher APY first
    expect(data.markets[1].symbol).toBe('USDC'); // Lower APY second
    expect(data.markets[0].apy).toBeGreaterThan(data.markets[1].apy);
  });
});
