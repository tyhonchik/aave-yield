import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTableFiltering } from '../use-table-filtering';
import { useTableSorting } from '../use-table-sorting';

// Mock data that represents real Aave markets
const mockMarkets = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    marketName: 'Ethereum V3',
    chainName: 'Ethereum',
    apy: 4.5,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    marketName: 'Polygon V3',
    chainName: 'Polygon',
    apy: 6.2,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    marketName: 'Arbitrum V3',
    chainName: 'Arbitrum',
    apy: 2.1,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    marketName: 'Ethereum V3',
    chainName: 'Ethereum',
    apy: 3.8,
  },
];

describe('useTableSorting', () => {
  it('should sort by APY in descending order by default (highest yields first)', () => {
    const { result } = renderHook(() => useTableSorting(mockMarkets));

    expect(result.current.sortKey).toBe('apy');
    expect(result.current.sortDir).toBe('desc');

    const sorted = result.current.sortedItems;
    expect(sorted[0].symbol).toBe('DAI'); // 6.2% APY
    expect(sorted[1].symbol).toBe('USDC'); // 4.5% APY
    expect(sorted[2].symbol).toBe('USDT'); // 3.8% APY
    expect(sorted[3].symbol).toBe('WETH'); // 2.1% APY
  });

  it('should toggle sort direction when clicking same column', () => {
    const { result } = renderHook(() => useTableSorting(mockMarkets));

    // Toggle APY sort to ascending (lowest yields first)
    act(() => {
      result.current.toggleSort('apy');
    });

    expect(result.current.sortDir).toBe('asc');
    const sorted = result.current.sortedItems;
    expect(sorted[0].symbol).toBe('WETH'); // 2.1% APY (lowest)
    expect(sorted[3].symbol).toBe('DAI'); // 6.2% APY (highest)
  });

  it('should sort alphabetically for text fields', () => {
    const { result } = renderHook(() => useTableSorting(mockMarkets));

    // Sort by symbol
    act(() => {
      result.current.toggleSort('symbol');
    });

    expect(result.current.sortKey).toBe('symbol');
    expect(result.current.sortDir).toBe('desc'); // New column starts desc

    const sorted = result.current.sortedItems;
    expect(sorted[0].symbol).toBe('WETH'); // Z-A order
    expect(sorted[1].symbol).toBe('USDT');
    expect(sorted[2].symbol).toBe('USDC');
    expect(sorted[3].symbol).toBe('DAI');
  });

  it('should handle edge cases that could break UI', () => {
    const emptyMarkets: typeof mockMarkets = [];
    const { result } = renderHook(() => useTableSorting(emptyMarkets));

    expect(result.current.sortedItems).toEqual([]);

    // Should not crash when toggling sort on empty data
    act(() => {
      result.current.toggleSort('apy');
    });

    expect(result.current.sortedItems).toEqual([]);
  });
});

describe('useTableFiltering', () => {
  it('should filter markets by symbol (most common user action)', async () => {
    const { result } = renderHook(() => useTableFiltering(mockMarkets));

    act(() => {
      result.current.setQuery('USD');
    });

    // Initially shows all results because debounce hasn't triggered yet
    expect(result.current.filteredItems).toHaveLength(4);

    // Wait for debounce to trigger (250ms)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    // Now should find USDC and USDT
    const filtered = result.current.filteredItems;
    expect(filtered).toHaveLength(2);
    expect(filtered.some((item) => item.symbol === 'USDC')).toBe(true);
    expect(filtered.some((item) => item.symbol === 'USDT')).toBe(true);
  });

  it('should filter markets by chain name', async () => {
    const { result } = renderHook(() => useTableFiltering(mockMarkets));

    act(() => {
      result.current.setQuery('ethereum');
    });

    // Wait for debounce
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    // Should find USDC, USDT (both on Ethereum), and WETH (Wrapped Ethereum contains "ethereum")
    const filtered = result.current.filteredItems;
    expect(filtered).toHaveLength(3); // USDC, USDT from chainName + WETH from name "Wrapped Ethereum"

    // Test more specific search
    act(() => {
      result.current.setQuery('Ethereum V3');
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    const specificFiltered = result.current.filteredItems;
    expect(specificFiltered).toHaveLength(2); // Only USDC and USDT have "Ethereum V3" in marketName
    expect(specificFiltered.every((item) => item.marketName === 'Ethereum V3')).toBe(true);
  });

  it('should be case insensitive and handle partial matches', async () => {
    const { result } = renderHook(() => useTableFiltering(mockMarkets));

    act(() => {
      result.current.setQuery('dai');
    });

    // Wait for debounce
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    const filtered = result.current.filteredItems;
    expect(filtered).toHaveLength(1);
    expect(filtered[0].symbol).toBe('DAI');

    // Test partial match
    act(() => {
      result.current.setQuery('wr');
    });

    // Wait for debounce again
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    const partialFiltered = result.current.filteredItems;
    expect(partialFiltered).toHaveLength(1);
    expect(partialFiltered[0].symbol).toBe('WETH'); // "Wrapped Ethereum"
  });

  it('should return all items when query is empty or whitespace', () => {
    const { result } = renderHook(() => useTableFiltering(mockMarkets));

    act(() => {
      result.current.setQuery('   ');
    });

    expect(result.current.filteredItems).toHaveLength(mockMarkets.length);

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.filteredItems).toHaveLength(mockMarkets.length);
  });

  it('should handle no results gracefully', async () => {
    const { result } = renderHook(() => useTableFiltering(mockMarkets));

    act(() => {
      result.current.setQuery('NONEXISTENT');
    });

    // Wait for debounce
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(result.current.filteredItems).toHaveLength(0);
  });
});
