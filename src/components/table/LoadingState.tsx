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
      {/* Controls Skeleton */}
      <div className="mb-4 mt-8 md:mt-12 space-y-3 md:space-y-0 md:flex md:items-end md:justify-between">
        <div className="flex-1">
          <div className="relative w-full md:max-w-md">
            <Skeleton className="h-9 w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-full sm:w-20 rounded" />
        </div>
      </div>

      {/* Desktop Table Skeleton */}
      <Card className="overflow-hidden py-0 hidden md:block">
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
      </Card>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-2">
        {skeletonRows.map((index) => (
          <Card key={index}>
            <div className="px-3 py-1">
              {/* Header */}
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-3 w-16 mb-0.5" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>

              {/* Asset Info */}
              <div className={`flex items-center justify-between ${isConnected ? 'mb-2' : ''}`}>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>

              {/* Balance Section */}
              {isConnected && (
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
