// supabaseClient.ts
// FitRealm — Supabase client singleton with AsyncStorage session persistence.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/environment';

// ── Database row types (mirror SQL schema) ──────────────────────────────────

export interface DBProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  invite_code: string;
  focus_goal: 'ausdauer' | 'diaet' | 'muskelaufbau';
  created_at: string;
  updated_at: string;
}

export interface DBGameState {
  id: string;
  user_id: string;
  rathaus_level: number;
  total_mm: number;
  current_mm: number;
  protein: number;
  wood: number;
  stone: number;
  food: number;
  streak_count: number;
  last_workout_at: string | null;
  state_data: Record<string, unknown>;
  version: number;
  updated_at: string;
  synced_at: string;
}

export interface DBWorkoutLog {
  id: string;
  user_id: string;
  workout_type: string;
  duration_min: number;
  active_kcal: number;
  steps: number;
  avg_hr: number | null;
  hr_zone: string | null;
  mm_earned: number;
  protein_earned: number;
  workout_date: string;
  recorded_at: string;
  healthkit_uuid: string;
}

export interface DBWeeklyStats {
  id: string;
  user_id: string;
  week_start: string;
  total_mm: number;
  total_protein: number;
  total_workouts: number;
  total_minutes: number;
  total_kcal: number;
  total_steps: number;
  streak_max: number;
  updated_at: string;
}

// ── Supabase client ─────────────────────────────────────────────────────────

export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      storage: {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
