/**
 * Configuration for React Query intervals and timing
 */

export const QUERY_CONFIG = {
  // Main markets data refresh
  MARKETS_REFRESH_INTERVAL: 30000, // 30 seconds
  MARKETS_STALE_TIME: 25000, // 25 seconds (should be less than refresh interval)

  // User balances refresh
  BALANCES_REFRESH_INTERVAL: 45000, // 45 seconds
  BALANCES_STALE_TIME: 40000, // 40 seconds

  // UI countdown update frequency
  UI_UPDATE_INTERVAL: 1000, // 1 second
} as const;

/**
 * Helper to get human-readable interval description
 */
export function getIntervalDescription(intervalMs: number): string {
  const seconds = Math.floor(intervalMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

/**
 * Calculate remaining time until next refresh based on React Query timing
 */
export function calculateNextRefreshTime(
  lastUpdatedAt: number | undefined,
  refreshInterval: number,
  staleTime: number,
): {
  remainingMs: number;
  remainingSeconds: number;
  isStale: boolean;
} {
  if (!lastUpdatedAt) {
    return {
      remainingMs: refreshInterval,
      remainingSeconds: Math.ceil(refreshInterval / 1000),
      isStale: false,
    };
  }

  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdatedAt;

  // Check if data is stale (should trigger immediate refetch if conditions are met)
  const isStale = timeSinceLastUpdate > staleTime;

  // Calculate time until next scheduled refresh
  const timeUntilNextRefresh = Math.max(0, refreshInterval - timeSinceLastUpdate);

  return {
    remainingMs: timeUntilNextRefresh,
    remainingSeconds: Math.ceil(timeUntilNextRefresh / 1000),
    isStale,
  };
}
