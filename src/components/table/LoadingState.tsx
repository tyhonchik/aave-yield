'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHeader } from './SortableTableHeader';

interface LoadingStateProps {
  message?: string;
  isConnected?: boolean;
}

export function LoadingState({ isConnected = false }: LoadingStateProps) {
  const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  return (
    <>
      <div className="mb-3 mt-12 flex flex-col gap-2 md:mb-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Skeleton className="h-9 w-full" />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHeader label="Market / Chain" />
                  <SortableTableHeader label="Reserve" />
                  <SortableTableHeader label="Symbol" />
                  <SortableTableHeader label="Supply APY" align="right" />
                  {isConnected && <SortableTableHeader label="Balance" align="right" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {skeletonRows.map((index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    {isConnected && (
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </>
  );
}
