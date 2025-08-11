'use client';

import { useMemo, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

export interface FilterableItem {
  symbol: string;
  name: string;
  marketName: string;
  chainName: string;
}

export function useTableFiltering<T extends FilterableItem>(items: T[]) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);

  const filteredItems = useMemo(() => {
    const searchTerm = debouncedQuery.trim().toLowerCase();

    if (!searchTerm) {
      return items;
    }

    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.marketName.toLowerCase().includes(searchTerm) ||
        item.chainName.toLowerCase().includes(searchTerm),
    );
  }, [items, debouncedQuery]);

  return {
    query,
    setQuery,
    filteredItems,
    debouncedQuery,
  };
}
