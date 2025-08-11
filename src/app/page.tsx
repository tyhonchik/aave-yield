'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AaveIcon } from '@/components/shared/icons';
import { TooltipProvider } from '@/components/ui/tooltip';

// Lazy load components that are not critical for initial render
const ConnectWallet = dynamic(
  () => import('@/components/shared/ConnectWallet').then((mod) => ({ default: mod.ConnectWallet })),
  {
    ssr: false,
    loading: () => <div className="h-9 w-24 bg-muted animate-pulse rounded" />,
  },
);

const ThemeToggle = dynamic(
  () => import('@/components/shared/ThemeToggle').then((mod) => ({ default: mod.ThemeToggle })),
  {
    ssr: false,
    loading: () => <div className="h-9 w-9 bg-muted animate-pulse rounded" />,
  },
);

const ApyTable = dynamic(() => import('./ApyTable'), {
  loading: () => <div className="h-96 bg-muted animate-pulse rounded" />,
});

export default function HomePage() {
  return (
    <TooltipProvider>
      <main className="mx-auto max-w-6xl px-3 py-4 md:px-4 md:py-6 lg:py-8">
        <header className="mb-6 md:mb-4">
          {/* Mobile Layout - Stack vertically */}
          <div className="flex flex-col gap-4 md:hidden">
            <div className="flex items-center gap-3">
              <AaveIcon size={24} />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold leading-tight">Aave Supply Yield</h1>
                <p className="text-xs text-muted-foreground">
                  Live Supply APY across Aave V3 markets
                </p>
              </div>
            </div>
            <div className="flex items-start justify-end gap-2">
              <Suspense fallback={<div className="h-9 w-24 bg-muted animate-pulse rounded" />}>
                <ConnectWallet />
              </Suspense>
              <Suspense fallback={<div className="h-9 w-9 bg-muted animate-pulse rounded" />}>
                <ThemeToggle />
              </Suspense>
            </div>
          </div>

          {/* Desktop Layout - Side by side */}
          <div className="hidden md:flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AaveIcon size={24} />
              <div>
                <h1 className="text-xl font-semibold leading-tight md:text-2xl">
                  Aave Supply Yield
                </h1>
                <p className="text-sm text-muted-foreground">
                  Live Supply APY across Aave V3 markets
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Suspense fallback={<div className="h-9 w-24 bg-muted animate-pulse rounded" />}>
                <ConnectWallet />
              </Suspense>
              <Suspense fallback={<div className="h-9 w-9 bg-muted animate-pulse rounded" />}>
                <ThemeToggle />
              </Suspense>
            </div>
          </div>
        </header>

        <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded" />}>
          <ApyTable />
        </Suspense>
      </main>
    </TooltipProvider>
  );
}
