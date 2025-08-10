'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type TestWalletContextValue = {
  address?: `0x${string}`;
  isConnected: boolean;
  connect: (addr: `0x${string}`) => void;
  disconnect: () => void;
};

const TestWalletContext = createContext<TestWalletContextValue | undefined>(undefined);

export function TestWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);
  const connect = useCallback((addr: `0x${string}`) => setAddress(addr), []);
  const disconnect = useCallback(() => setAddress(undefined), []);
  const value = useMemo<TestWalletContextValue>(
    () => ({ address, isConnected: Boolean(address), connect, disconnect }),
    [address, connect, disconnect],
  );
  return <TestWalletContext.Provider value={value}>{children}</TestWalletContext.Provider>;
}

export function useTestWallet(): TestWalletContextValue {
  const ctx = useContext(TestWalletContext);
  if (!ctx) throw new Error('useTestWallet must be used within TestWalletProvider');
  return ctx;
}
