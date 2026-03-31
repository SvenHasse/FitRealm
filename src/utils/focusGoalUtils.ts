// focusGoalUtils.ts
// Helpers for the 14-day fitness-focus lock.
//
// After a user sets or changes their fitnessFocus the selection is locked for
// 14 days so the streak logic remains consistent. The lock timestamp is stored
// as `focusGoalLastChangedAt` on UserProfile (0 = never changed = always unlocked).

const FOCUS_GOAL_LOCK_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in ms

/**
 * Returns true while the focus goal is still locked (i.e. less than 14 days
 * have passed since the last change).
 */
export function isFocusGoalLocked(focusGoalLastChangedAt: number): boolean {
  if (focusGoalLastChangedAt === 0) return false; // never changed → always unlocked
  return Date.now() - focusGoalLastChangedAt < FOCUS_GOAL_LOCK_MS;
}

/**
 * Returns the number of full days remaining until the lock expires.
 * Returns 0 if already unlocked.
 */
export function getFocusGoalUnlockDaysRemaining(focusGoalLastChangedAt: number): number {
  if (!isFocusGoalLocked(focusGoalLastChangedAt)) return 0;
  const remaining = FOCUS_GOAL_LOCK_MS - (Date.now() - focusGoalLastChangedAt);
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}
