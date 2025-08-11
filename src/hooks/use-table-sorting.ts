'use client';

import { useMemo, useState } from 'react';

export type SortKey = 'apy' | 'marketName' | 'name' | 'symbol';
export type SortDir = 'asc' | 'desc';

export interface SortableItem {
  apy: number;
  marketName: string;
  name: string;
  symbol: string;
}

export function useTableSorting<T extends SortableItem>(items: T[]) {
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortKey === 'apy') {
        return sortDir === 'desc' ? b.apy - a.apy : a.apy - b.apy;
      }
      const aVal = String(a[sortKey]).toLowerCase();
      const bVal = String(b[sortKey]).toLowerCase();
      return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });
  }, [items, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return {
    sortKey,
    sortDir,
    sortedItems,
    toggleSort,
  };
}
