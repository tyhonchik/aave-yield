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
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600'],
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500'],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'Aave Supply Yield',
  description: 'Real-time Aave V3 Supply APY tracker across multiple chains',
  icons: {
    icon: '/favicon.ico',
  },

  robots: {
    index: false,
    follow: false,
  },
  other: {
    'dns-prefetch': '//fonts.googleapis.com',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Optimize critical resource hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Critical CSS inline to prevent render blocking */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            html {
              font-family: ${geist.style.fontFamily};
              --font-sans: ${geist.variable};
              --font-mono: ${geistMono.variable};
            }
            /* Critical above-the-fold styles */
            body { margin: 0; }
            .loading-skeleton { 
              animation: pulse 1.5s ease-in-out infinite;
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `,
          }}
        />

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `,
          }}
        />
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
