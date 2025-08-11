'use client';

import { TableHeader, TableRow } from '@/components/ui/table';
import type { SortDir, SortKey } from '@/hooks/use-table-sorting';
import { SortableTableHeader } from './SortableTableHeader';

interface MarketTableHeaderProps {
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  isConnected: boolean;
}

export function MarketTableHeader({
  sortKey,
  sortDir,
  onSort,
  isConnected,
}: MarketTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <SortableTableHeader
          label="Market / Chain"
          active={sortKey === 'marketName'}
          dir={sortDir}
          onClick={() => onSort('marketName')}
        />
        <SortableTableHeader
          label="Reserve"
          active={sortKey === 'name'}
          dir={sortDir}
          onClick={() => onSort('name')}
        />
        <SortableTableHeader
          label="Symbol"
          active={sortKey === 'symbol'}
          dir={sortDir}
          onClick={() => onSort('symbol')}
        />
        <SortableTableHeader
          label="Supply APY"
          active={sortKey === 'apy'}
          dir={sortDir}
          onClick={() => onSort('apy')}
          align="right"
        />
        {isConnected && <SortableTableHeader label="Balance" align="right" />}
      </TableRow>
    </TableHeader>
  );
}
