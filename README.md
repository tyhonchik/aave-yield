# Aave Supply Yield

Real-time Aave V3 Supply APY tracker across multiple chains.

## Tech Stack

- **Next.js 15** with App Router and TypeScript
- **Wagmi & Viem** for Web3 interactions
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** + **shadcn/ui** for styling
- **Vitest** for testing
- **ESLint & Prettier** with pre-commit hooks (Husky)

## Quick Start

```bash
# Install Node.js (use nvm if available)
nvm use  # or ensure Node.js >=20

# Install dependencies
npm i

# Copy environment file and add your RPC URLs with dkey
cp .env.example .env
# Edit .env and replace dkey with your actual key

# Run development server
npm run dev
```

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Main dashboard
│   ├── layout.tsx             # Root layout with providers
│   └── api/aave/markets/      # Backend API endpoint
├── components/                 # UI Components
│   ├── shared/                # Reusable components (icons, wallet, theme)
│   ├── table/                 # Table-specific components
│   └── ui/                    # shadcn/ui base components
├── hooks/                      # Custom React hooks
│   ├── use-aave-markets.ts    # Main markets data fetching
│   ├── use-user-balances.ts   # Wallet balances
│   ├── use-table-sorting.ts   # Table sorting logic
│   └── use-table-filtering.ts # Search/filter functionality
├── config/                     # Configuration
│   ├── aave-config.ts         # Networks & contract addresses
│   ├── env.ts                 # Environment validation
│   ├── wagmi.ts               # Wagmi client setup
│   └── query-config.ts        # React Query settings
├── lib/                        # Core utilities
│   ├── multicall.ts           # Batch RPC calls
│   ├── contract-utils.ts      # APY calculations
│   ├── error.ts               # Error handling system
│   └── format.ts              # Data formatting
└── providers/                  # React Context providers
    ├── WagmiProvider.tsx      # Web3 setup
    ├── QueryProvider.tsx      # TanStack Query
    └── ThemeProvider.tsx      # Dark/light theme
```

## Performance Optimizations

- **Multicall batching**: All contract calls per chain in single RPC request
- **Parallel chain queries**: All 5 chains fetched simultaneously
- **React Query caching**: 30s refresh interval with stale-while-revalidate
- **Debounced search**: 250ms delay on filter input
- **Server-side RPC**: Environment variables kept secure
- **Graceful degradation**: Shows working markets even if some fail
- **Service Worker**: Progressive Web App capabilities with offline functionality and caching

## Error Handling & Graceful Degradation

The application uses error handling that ensures proper user experience:

### Graceful Degradation Strategy

- **Partial failures are handled gracefully**: If 3 out of 5 networks fail, you still see data from 2 working networks
- **Individual asset errors**: If specific tokens fail to load, other assets from the same network still display
- **Error reporting**: Failed markets are shown with specific error messages and retry options
- **No total failures**: Application works as long as at least one market loads successfully

### Error Types

- **Network timeouts**: Automatic retry with exponential backoff
- **RPC failures**: Fallback to showing cached data when possible
- **Contract errors**: Specific error messages for debugging
- **Validation errors**: Clear user feedback for configuration issues

## Current Networks

- Ethereum Mainnet
- Polygon
- Base
- Arbitrum
- Optimism

## Adding New Networks

1. Add RPC URL to `src/config/env.ts`:

```typescript
RPC_NEWCHAIN: z.string().url();
```

2. Add market config to `src/config/aave-config.ts`:

```typescript
{
  id: 'new-v3',
  label: 'Aave V3 NewChain',
  chainId: newchain.id,
  chain: newchain,
  getRpcUrl: (env) => env.RPC_NEWCHAIN,
  pool: AaveV3NewChain.POOL,
  enabled: true
}
```

3. Import chain from `viem/chains` and addresses from `@bgd-labs/aave-address-book`

## Configuration System

The application uses a centralized configuration system for maximum flexibility and maintainability:

### Environment Configuration (`src/config/env.ts`)

- **Purpose**: Validates and types environment variables using Zod
- **Validation**: Ensures all envs are valid before app starts
- **Type safety**: Provides typed environment variables throughout the app

### Aave Markets Configuration (`src/config/aave-config.ts`)

- **Purpose**: Central registry of all supported Aave V3 markets
- **Features**:
  - Chain information (ID, name, explorer URLs)
  - Contract addresses (Pool, AddressesProvider, UIPoolDataProvider)
  - RPC configuration per network
  - Enable/disable markets individually

### Wagmi Configuration (`src/config/wagmi.ts`)

- **Purpose**: Web3 client setup with proper chain and transport configuration
- **Auto-generated**: Builds Wagmi config from Aave markets configuration

### Query Configuration (`src/config/query-config.ts`)

- **Purpose**: Centralized React Query settings
- **Timing controls**: Refresh intervals, stale times, retry policies
- **Performance**: Optimized caching and background updates
- **Flexibility**: Easy to adjust polling frequencies per data type

This configuration system allows for:

- **Easy scaling**: Add new networks by updating one file
- **Environment flexibility**: Different RPC URLs per deployment
- **Type safety**: TypeScript support across all configurations
- **Maintainability**: Single place to update market information

## Test Wallets

For testing wallet functionality, the app includes pre-configured test addresses:

- `0x01CB1D7f983150Bff188Bafe89f7AC47432bB645` (Wallet C)
- `0x1111222233334444555566667777888899990000` (Wallet D)

### Adding New Test Wallets

To add more test wallets, edit `src/components/shared/ConnectWallet.tsx`:

```typescript
const TEST_WALLETS: TestWalletOption[] = [
  { label: 'Wallet C', address: '0x01CB1D7f983150Bff188Bafe89f7AC47432bB645' },
  { label: 'Wallet D', address: '0x1111222233334444555566667777888899990000' },
  // Add new wallets here:
  { label: 'Your Label', address: '0xYourWalletAddress...' },
];
```

Test wallets work independently from real wallet connections and are perfect for development/demo purposes.

## Development Tools

- **Pre-commit hooks**: Husky runs linting and formatting
- **Code quality**: ESLint + Prettier with strict rules
- **Type safety**: Full TypeScript with Zod validation
- **Testing**: Vitest with comprehensive test coverage

## Commands

```bash
npm run dev         # Development server with Turbopack
npm run build       # Production build
npm run test        # Run tests
npm run test:run    # Run tests once
npm run lint        # Lint code
npm run lint:fix    # Fix linting issues
npm run format      # Format code with Prettier
npm run type-check  # TypeScript check
npm run check       # Run all checks (type + lint + format)
```

## Features

- ✅ Live APY data from 5 Aave V3 markets
- ✅ Sortable & searchable interface
- ✅ Wallet connection with balances
- ✅ Auto-refresh with manual control
- ✅ Dark/light theme toggle
- ✅ TypeScript + Zod validation
- ✅ Unit tests with Vitest
- ✅ Mobile responsive design

## Key Components

- **ApyTable**: Main data table with sorting/filtering
- **useAaveMarkets**: Custom hook for market data fetching
- **multicall**: Efficient batch contract reads
- **Error handling**: Graceful degradation for partial failures
- **Test wallet provider**: For development without real wallet
