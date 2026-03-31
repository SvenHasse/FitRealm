// streakUtils.ts
// Countdown calculation + milestone status logic for the streak system.

import { STREAK_CONFIG, STREAK_COUNTDOWN_THRESHOLDS } from '../config/GameConfig';

export interface StreakMilestone {
  days: number;
  nameKey: string;         // i18n key — use t(nameKey)
  emoji: string;
  rewardDescKey: string;   // i18n key — use t(rewardDescKey)
  rewardDetails: Record<string, unknown>;
  /** Number of streak shields granted when this milestone is collected (0 if none). */
  shields: number;
}

/** Derived from STREAK_CONFIG.milestones — single source of truth. */
export const STREAK_MILESTONES: StreakMilestone[] = STREAK_CONFIG.milestones.map(m => ({
  days: m.days,
  nameKey: m.nameKey,
  emoji: m.emoji,
  rewardDescKey: m.rewardDescKey,
  rewardDetails: { ...m.reward } as Record<string, unknown>,
  shields: ('shields' in m.reward) ? (m.reward as any).shields as number : 0,
}));

// ─── Milestone status ─────────────────────────────────────────────────────────

export type MilestoneStatus = 'collected' | 'ready' | 'next' | 'upcoming';

export interface MilestoneWithStatus {
  milestone: StreakMilestone;
  status: MilestoneStatus;
}

/**
 * Assign a status to every milestone for the current streak.
 * 'next' is the single first upcoming milestone (smallest days > streak).
 */
export function computeMilestoneStatuses(
  streak: number,
  collectedIds: number[],
): MilestoneWithStatus[] {
  let nextAssigned = false;
  return STREAK_MILESTONES.map(m => {
    let status: MilestoneStatus;
    if (collectedIds.includes(m.days)) {
      status = 'collected';
    } else if (streak >= m.days) {
      status = 'ready';
    } else if (!nextAssigned) {
      status = 'next';
      nextAssigned = true;
    } else {
      status = 'upcoming';
    }
    return { milestone: m, status };
  });
}

// ─── Countdown ────────────────────────────────────────────────────────────────

export type CountdownLevel = 'safe' | 'warning' | 'danger' | 'expired';

export interface CountdownInfo {
  msRemaining: number;
  level: CountdownLevel;
  text: string;
}

/**
 * Returns a countdown to the 48-hour streak expiry window.
 * Call this inside a setInterval(1000) for a live display.
 */
export function getCountdownInfo(lastWorkoutDate: Date | null): CountdownInfo {
  if (!lastWorkoutDate) {
    return { msRemaining: 0, level: 'expired', text: 'Streak abgelaufen' };
  }

  const remaining = lastWorkoutDate.getTime() + STREAK_CONFIG.resetAfterHours * 3_600_000 - Date.now();

  if (remaining <= 0) {
    return { msRemaining: 0, level: 'expired', text: 'Streak abgelaufen' };
  }

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);

  if (remaining > STREAK_COUNTDOWN_THRESHOLDS.safeAboveMs) {
    return {
      msRemaining: remaining,
      level: 'safe',
      text: `Noch ${h}h ${m}min bis Streak-Reset`,
    };
  }
  if (remaining > STREAK_COUNTDOWN_THRESHOLDS.warningAboveMs) {
    return {
      msRemaining: remaining,
      level: 'warning',
      text: `Noch ${h}h ${m}min — trainiere heute!`,
    };
  }
  return {
    msRemaining: remaining,
    level: 'danger',
    text: `Nur noch ${h > 0 ? `${h}h ` : ''}${m}min — Streak in Gefahr!`,
  };
}

// ─── Shield countdown ─────────────────────────────────────────────────────────

/**
 * Returns a human-readable countdown string for an active streak shield.
 * E.g. "1T 6h", "5h 23m", "abgelaufen"
 */
export function formatShieldCountdown(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'abgelaufen';
  const totalMinutes = Math.floor(remaining / 60_000);
  const hours        = Math.floor(totalMinutes / 60);
  const minutes      = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}T ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatLastWorkoutLabel(
  date: Date,
  workoutType: string,
  durationMinutes: number,
): string {
  const isToday = new Date().toDateString() === date.toDateString();
  const dateStr = isToday
    ? `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
    : date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${dateStr} · ${workoutType}${durationMinutes > 0 ? ` (${durationMinutes} Min)` : ''}`;
}
