const FIXED_LOCALE = 'en-US';

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat(FIXED_LOCALE, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-';
  return `${formatNumber(value, digits)}%`;
}

export function formatApy(apy: number): string {
  return formatPercent(apy, 2);
}
