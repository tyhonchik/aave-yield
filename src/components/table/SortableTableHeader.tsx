'use client';

import { TableHead } from '@/components/ui/table';
import type { SortDir, SortKey } from '@/hooks/use-table-sorting';

interface SortableTableHeaderProps {
  label: string;
  sortKey?: SortKey;
  active?: boolean;
  dir?: SortDir;
  onClick?: () => void;
  align?: 'left' | 'right';
}

export function SortableTableHeader({
  label,
  active,
  dir,
  onClick,
  align = 'left',
}: SortableTableHeaderProps) {
  const justify = align === 'right' ? 'justify-end' : 'justify-start';
  const cursor = onClick ? 'cursor-pointer' : '';

  return (
    <TableHead
      className={`group text-sm font-medium text-muted-foreground select-none ${cursor}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className={`flex items-center ${justify} gap-1`}>
        <span>{label}</span>
        {onClick && (
          <span className="text-xs text-muted-foreground/50">
            {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
          </span>
        )}
      </div>
    </TableHead>
  );
}
