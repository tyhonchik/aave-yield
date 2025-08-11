import { ConnectWallet } from '@/components/shared/ConnectWallet';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import ApyTable from './ApyTable';

export default function AavePage() {
  return (
    <TooltipProvider>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-muted to-background p-2 shadow-sm">
              <div className="h-6 w-6 rounded bg-emerald-500/90 shadow-inner" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight md:text-2xl">Aave Supply Yield</h1>
              <p className="text-sm text-muted-foreground">
                Live Supply APY across Aave V3 markets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectWallet />
          </div>
        </header>

        <ApyTable />
      </main>
    </TooltipProvider>
  );
}
