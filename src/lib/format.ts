/**
 * Format APY percentage for display
 */
export function formatApy(apy: number | null): string {
  if (apy === null || !Number.isFinite(apy)) {
    return '—';
  }

  if (apy === 0) {
    return '0%';
  }

  // For very small percentages, show more precision
  if (apy < 0.01) {
    return `${apy.toFixed(4)}%`;
  }

  // For normal percentages, show 2 decimal places
  if (apy < 10) {
    return `${apy.toFixed(2)}%`;
  }

  // For larger percentages, show 1 decimal place
  return `${apy.toFixed(1)}%`;
}

/**
 * Format balance for display
 */
export function formatBalance(balance: string | number | bigint | null): string {
  if (balance === null || balance === undefined) {
    return '—';
  }

  const num = typeof balance === 'bigint' ? Number(balance) : Number(balance);

  if (!Number.isFinite(num) || num === 0) {
    return '0';
  }

  // For very small amounts
  if (num < 0.0001) {
    return '<0.0001';
  }

  // For small amounts
  if (num < 1) {
    return num.toFixed(4);
  }

  // For medium amounts
  if (num < 1000) {
    return num.toFixed(2);
  }

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }

  return num.toFixed(2);
}

/**
 * Format number with locale-specific thousands separator
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || !Number.isFinite(num)) {
    return '—';
  }

  return num.toLocaleString();
}
