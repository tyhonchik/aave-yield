import { ConnectWallet } from '@/components/shared/ConnectWallet';
import { AaveIcon } from '@/components/shared/icons';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import ApyTable from './ApyTable';

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
              <ConnectWallet />
              <ThemeToggle />
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
              <ConnectWallet />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <ApyTable />
      </main>
    </TooltipProvider>
  );
}
