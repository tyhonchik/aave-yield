'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Devtools />
    </QueryClientProvider>
  );
}

type DevtoolsComponent = React.ComponentType<{ initialIsOpen?: boolean }>;

function Devtools() {
  const [Impl, setImpl] = useState<DevtoolsComponent | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    import('@tanstack/react-query-devtools')
      .then((m: { ReactQueryDevtools: DevtoolsComponent }) => setImpl(() => m.ReactQueryDevtools))
      .catch(() => {});
  }, []);
  return Impl ? <Impl initialIsOpen={false} /> : null;
}
