import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { getValidatedEnv } from '@/config/env';
import { QueryProvider } from '@/providers/QueryProvider';
import { TestWalletProvider } from '@/providers/TestWalletProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WagmiProvider } from '@/providers/WagmiProvider';

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aave Supply Yield',
  description: 'Real-time Aave V3 Supply APY tracker across multiple chains',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = getValidatedEnv();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${geist.style.fontFamily};
  --font-sans: ${geist.variable};
  --font-mono: ${geistMono.variable};
}
        `}</style>
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WagmiProvider env={env}>
            <QueryProvider>
              <TestWalletProvider>{children}</TestWalletProvider>
            </QueryProvider>
          </WagmiProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
