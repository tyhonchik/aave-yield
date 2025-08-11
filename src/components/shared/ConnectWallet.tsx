'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTestWallet } from '@/providers/TestWalletProvider';

type TestWalletOption = {
  label: string;
  address: `0x${string}`;
};

const TEST_WALLETS: TestWalletOption[] = [
  { label: 'Wallet C', address: '0x01CB1D7f983150Bff188Bafe89f7AC47432bB645' },
  { label: 'Wallet D', address: '0x1111222233334444555566667777888899990000' },
];

export function ConnectWallet() {
  const { address, isConnected, connect, disconnect } = useTestWallet();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-md border px-2 py-1 text-xs font-mono cursor-help">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">{address}</p>
            </TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Use Test Wallet
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md focus:outline-none"
        >
          <div className="p-1">
            {TEST_WALLETS.map((tw) => (
              <button
                key={tw.address}
                role="menuitem"
                className="w-full text-left rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                onClick={() => {
                  connect(tw.address);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{tw.label}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {tw.address.slice(0, 6)}...{tw.address.slice(-4)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
