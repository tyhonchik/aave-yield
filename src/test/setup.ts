import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the Web3Icon component since it uses dynamic imports
vi.mock('@bgd-labs/react-web3-icons', () => ({
  Web3Icon: vi.fn(() => 'MockedWeb3Icon'),
}));

// Mock next/dynamic for dynamic imports
vi.mock('next/dynamic', () => ({
  default: () => {
    const Component = vi.fn(() => 'MockedDynamicComponent') as {
      (): string;
      displayName?: string;
    };
    Component.displayName = 'MockedDynamicComponent';
    return Component;
  },
}));
