// useFriendsStore.ts
// Zustand für Freunde, Stamm und Einlade-System.
// Persistiert via AsyncStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FriendsState, Friend, Tribe, TribeQuest, TribeType } from '../models/types';
import { findRival, getMmBoostForLevel } from '../utils/friendsUtils';

interface FriendsStore extends FriendsState {
  // Freunde
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  updateFriendActivity: (id: string, weeklyMM: number, streak: number, lastActiveAt: number) => void;
  updateRival: (myWeeklyMM: number) => void;

  // Stamm
  createTribe: (name: string, emblem: string, type: TribeType) => void;
  joinTribe: (tribe: Tribe) => void;
  leaveTribe: () => void;
  updateTribeProgress: (weeklyMM: number) => void;
  completeTribeQuest: () => void;

  // Einladen
  setMyInviteCode: (code: string) => void;
  recordInviteUsed: () => void;      // jemand hat den Code eingesetzt
  activateInviteReward: () => void;  // Freund ist nach 7 Tagen noch aktiv → Belohnung
}

const WEEKLY_QUEST_TEMPLATES: Omit<TribeQuest, 'id' | 'progress' | 'expiresAt' | 'completed'>[] = [
  {
    description: 'Sammelt zusammen 8.000 MM diese Woche',
    goalType: 'total_mm',
    goal: 8000,
    rewardDescription: '30 Protein für alle',
    rewardType: 'protein',
    rewardAmount: 30,
  },
  {
    description: 'Jedes Mitglied hält seinen Streak 5 Tage',
    goalType: 'all_streaks',
    goal: 5,
    rewardDescription: '1 Streak-Shield für alle',
    rewardType: 'streak_shield',
    rewardAmount: 1,
  },
  {
    description: 'Absolviert zusammen 15 Workouts',
    goalType: 'total_workouts',
    goal: 15,
    rewardDescription: '500 MM-Bonus für alle',
    rewardType: 'mm_bonus',
    rewardAmount: 500,
  },
];

function generateWeeklyQuest(): TribeQuest {
  const template = WEEKLY_QUEST_TEMPLATES[Math.floor(Math.random() * WEEKLY_QUEST_TEMPLATES.length)];
  const now = new Date();
  const nextMonday = new Date(now);
  const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return {
    ...template,
    id: `quest_${Date.now()}`,
    progress: 0,
    expiresAt: nextMonday.getTime(),
    completed: false,
  };
}

const LEVEL_THRESHOLDS = [0, 5000, 15000, 35000, 70000, 120000];

export const useFriendsStore = create<FriendsStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────────
      friends: [],
      tribe: null,
      rivalId: null,
      inviteStats: {
        myCode: '',
        invitedCount: 0,
        activeCount: 0,
        shieldsEarned: 0,
        pendingRewards: 0,
      },

      // ── Freunde ──────────────────────────────────────────────────────────────
      addFriend: (friend) =>
        set((s) => ({ friends: [...s.friends, friend] })),

      removeFriend: (id) =>
        set((s) => ({ friends: s.friends.filter((f) => f.id !== id) })),

      updateFriendActivity: (id, weeklyMM, streak, lastActiveAt) =>
        set((s) => ({
          friends: s.friends.map((f) =>
            f.id === id ? { ...f, weeklyMM, currentStreak: streak, lastActiveAt } : f
          ),
        })),

      updateRival: (myWeeklyMM) => {
        const rival = findRival(myWeeklyMM, get().friends);
        set({ rivalId: rival?.id ?? null });
      },

      // ── Stamm ─────────────────────────────────────────────────────────────────
      createTribe: (name, emblem, type) => {
        const level = 1;
        set({
          tribe: {
            id: `tribe_${Date.now()}`,
            name,
            emblem,
            type,
            joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            members: [],
            level,
            weeklyMMGoal: 5000,
            currentWeeklyMM: 0,
            activeQuest: generateWeeklyQuest(),
            mmBoostPercent: getMmBoostForLevel(level),
          },
        });
      },

      joinTribe: (tribe) => set({ tribe }),

      leaveTribe: () => set({ tribe: null }),

      updateTribeProgress: (weeklyMM) =>
        set((s) => {
          if (!s.tribe) return s;
          const updatedMM = s.tribe.currentWeeklyMM + weeklyMM;
          const totalMM = s.tribe.members.reduce((sum, m) => sum + m.totalMM, 0);
          let newLevel = s.tribe.level;
          for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (totalMM >= LEVEL_THRESHOLDS[i]) { newLevel = i; break; }
          }
          return {
            tribe: {
              ...s.tribe,
              currentWeeklyMM: updatedMM,
              level: newLevel,
              mmBoostPercent: getMmBoostForLevel(newLevel),
            },
          };
        }),

      completeTribeQuest: () =>
        set((s) => {
          if (!s.tribe?.activeQuest) return s;
          return {
            tribe: {
              ...s.tribe,
              activeQuest: { ...s.tribe.activeQuest, completed: true },
            },
          };
        }),

      // ── Einladen ─────────────────────────────────────────────────────────────
      setMyInviteCode: (code) =>
        set((s) => ({ inviteStats: { ...s.inviteStats, myCode: code } })),

      recordInviteUsed: () =>
        set((s) => ({
          inviteStats: {
            ...s.inviteStats,
            invitedCount: s.inviteStats.invitedCount + 1,
            pendingRewards: s.inviteStats.pendingRewards + 1,
          },
        })),

      activateInviteReward: () =>
        set((s) => ({
          inviteStats: {
            ...s.inviteStats,
            activeCount: s.inviteStats.activeCount + 1,
            pendingRewards: Math.max(0, s.inviteStats.pendingRewards - 1),
            shieldsEarned: s.inviteStats.shieldsEarned + 3, // 3 Shields pro aktivem Freund
          },
        })),
    }),
    {
      name: 'friends-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
