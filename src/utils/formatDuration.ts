// formatDuration.ts
// FitRealm - Shared utility for formatting construction/countdown durations

/**
 * Formats a duration in seconds into a human-readable string.
 * Returns "Sofort" for 0 (instant), seconds for < 1 min,
 * minutes for < 1 h, and hours+minutes for >= 1 h.
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return 'Sofort';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.round(seconds / 60);
    return `${m} Min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
