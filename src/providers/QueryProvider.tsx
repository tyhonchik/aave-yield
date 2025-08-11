'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { shouldRetryRequest } from '@/lib/fetch';
import { logError, shouldNotifyError, showErrorNotification } from '@/lib/notifications';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: shouldRetryRequest,
            refetchOnWindowFocus: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            logError(error, `Query: ${query.queryKey.join('-')}`);

            const hasData = query.state.data !== undefined;
            if (shouldNotifyError(error, hasData)) {
              showErrorNotification(error);
            }
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Devtools />
    </QueryClientProvider>
  );
}

function Devtools() {
  const [Impl, setImpl] = useState<React.ComponentType<{ initialIsOpen?: boolean }> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@tanstack/react-query-devtools')
        .then((m) => setImpl(() => m.ReactQueryDevtools))
        .catch(() => {});
    }
  }, []);

  return Impl ? <Impl initialIsOpen={false} /> : null;
}
