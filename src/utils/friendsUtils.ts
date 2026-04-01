// friendsUtils.ts
// Hilfsfunktionen für den Freunde- und Stamm-Tab.

import { Friend, FriendStatus, Tribe } from '../models/types';

/** Status eines Freundes bestimmen */
export function getFriendStatus(friend: Friend): FriendStatus {
  const todayStart = new Date().setHours(0, 0, 0, 0);

  if (friend.lastActiveAt >= todayStart) return 'active_today';

  // Streak in Gefahr: nach 20 Uhr, heute noch nicht aktiv, hat Streak > 0
  const hour = new Date().getHours();
  if (hour >= 20 && friend.currentStreak > 0) return 'streak_danger';

  return 'inactive';
}

/** Rival bestimmen: Freund mit ähnlichster weeklyMM */
export function findRival(myWeeklyMM: number, friends: Friend[]): Friend | null {
  if (friends.length === 0) return null;
  return friends.reduce((closest, f) => {
    const distA = Math.abs(closest.weeklyMM - myWeeklyMM);
    const distB = Math.abs(f.weeklyMM - myWeeklyMM);
    return distB < distA ? f : closest;
  });
}

/** Freunde nach weeklyMM sortiert für das Leaderboard */
export function getLeaderboard(
  friends: Friend[],
  myWeeklyMM: number,
): Array<Friend & { isMe?: boolean }> {
  const me = { id: 'me', weeklyMM: myWeeklyMM, isMe: true } as Friend & { isMe: boolean };
  return [...friends, me].sort((a, b) => b.weeklyMM - a.weeklyMM);
}

/** Stammeshaus-Buff auf MM anwenden */
export function applyTribeBuff(baseMM: number, tribe: Tribe | null): number {
  if (!tribe || tribe.mmBoostPercent === 0) return baseMM;
  return Math.round(baseMM * (1 + tribe.mmBoostPercent / 100));
}

/** MM-Schwelle für einen Stamm-Level */
export function getTribeLevelThreshold(level: number): number {
  const thresholds = [0, 5000, 15000, 35000, 70000, 120000];
  return thresholds[Math.min(level, thresholds.length - 1)];
}

/** MM-Boost-Prozent abhängig vom Stammlevel */
export function getMmBoostForLevel(level: number): number {
  const boosts = [0, 3, 5, 8, 12, 15];
  return boosts[Math.min(level, boosts.length - 1)];
}
