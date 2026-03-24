// streakUtils.ts
// Countdown calculation + milestone status logic for the streak system.

export interface StreakMilestone {
  days: number;
  name: string;
  emoji: string;
  reward: string;
  rewardDetails: Record<string, unknown>;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    name: 'Erster Schritt',
    emoji: '🌱',
    reward: '+50g Muskelmasse + 100 Holz',
    rewardDetails: { muskelmasse: 50, holz: 100 },
  },
  {
    days: 7,
    name: 'Aufgewärmt',
    emoji: '🔥',
    reward: '+3 Protein + Streak Shield',
    rewardDetails: { protein: 3, streakShield: true },
  },
  {
    days: 14,
    name: 'Dranbleiber',
    emoji: '💪',
    reward: '+100g Muskelmasse + 200 Holz + 7 Tage Kalorien-Boost',
    rewardDetails: { muskelmasse: 100, holz: 200, kalorienBoost7d: true },
  },
  {
    days: 21,
    name: 'Krieger',
    emoji: '⚡',
    reward: '+5 Protein + 300 Holz + Profilrahmen',
    rewardDetails: { protein: 5, holz: 300, profileFrame: 'Eisenkrieger' },
  },
  {
    days: 30,
    name: 'Monatsheld',
    emoji: '🏅',
    reward: '+200g + 5 Protein + 500 Holz + 7 Tage +15% Produktion',
    rewardDetails: { muskelmasse: 200, protein: 5, holz: 500, productionBoost7d: true },
  },
  {
    days: 50,
    name: 'Ausdauerprofi',
    emoji: '💎',
    reward: '+10 Protein + 1.000 Holz + Dauerhafter Kalorien-Bonus',
    rewardDetails: { protein: 10, holz: 1000, permanentKalorienBonus: true },
  },
  {
    days: 100,
    name: 'Legende',
    emoji: '🏆',
    reward: '+20 Protein + 2.000 Holz + Titan Dorf-Skin + +5% Muskelmasse permanent',
    rewardDetails: { protein: 20, holz: 2000, skin: 'Titan', permanentMuskelmasse: true },
  },
  {
    days: 365,
    name: 'Unsterblich',
    emoji: '👑',
    reward: '+50 Protein + alle Basis-Skins + +10% Produktion permanent',
    rewardDetails: { protein: 50, allSkins: true, permanentProduction: true },
  },
];

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

  const remaining = lastWorkoutDate.getTime() + 48 * 3_600_000 - Date.now();

  if (remaining <= 0) {
    return { msRemaining: 0, level: 'expired', text: 'Streak abgelaufen' };
  }

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);

  if (remaining > 24 * 3_600_000) {
    return {
      msRemaining: remaining,
      level: 'safe',
      text: `Noch ${h}h ${m}min bis Streak-Reset`,
    };
  }
  if (remaining > 12 * 3_600_000) {
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
