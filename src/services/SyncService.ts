// SyncService.ts
// FitRealm — Offline-first game state sync with Supabase.

import { supabase, DBGameState } from './supabaseClient';
import { GameState, createDefaultGameState, gameStateRathausLevel } from '../models/types';
import { config } from '../config/environment';

// ── Types ───────────────────────────────────────────────────────────────────

export type SyncOutcome = 'uploaded' | 'downloaded' | 'no_change' | 'first_upload' | 'error';

export interface SyncResult {
  outcome: SyncOutcome;
  gameState?: GameState;
  version?: number;
  error?: string;
}

// ── Conversion: GameState → DB format ───────────────────────────────────────

export function gameStateToDBFormat(
  gameState: GameState,
  currentVersion: number,
): Omit<DBGameState, 'id' | 'user_id' | 'synced_at'> {
  // Extract indexed fields
  const {
    muskelmasse, protein, wood, stone, food,
    currentStreak, lastWorkoutDate,
    // Everything else goes into state_data
    ...rest
  } = gameState;

  return {
    rathaus_level: gameStateRathausLevel(gameState),
    total_mm: muskelmasse,
    current_mm: muskelmasse,
    protein,
    wood,
    stone,
    food,
    streak_count: currentStreak,
    last_workout_at: lastWorkoutDate ? new Date(lastWorkoutDate).toISOString() : null,
    state_data: rest as unknown as Record<string, unknown>,
    version: currentVersion,
    updated_at: new Date().toISOString(),
  };
}

// ── Conversion: DB format → GameState ───────────────────────────────────────

export function dbFormatToGameState(dbState: DBGameState): GameState {
  const defaults = createDefaultGameState();
  const stateData = (dbState.state_data ?? {}) as Partial<GameState>;

  return {
    ...defaults,
    ...stateData,
    // Override with indexed top-level fields
    muskelmasse: Number(dbState.current_mm) || 0,
    protein: Number(dbState.protein) || 0,
    wood: Number(dbState.wood) || 0,
    stone: Number(dbState.stone) || 0,
    food: Number(dbState.food) || 0,
    currentStreak: Number(dbState.streak_count) || 0,
    lastWorkoutDate: dbState.last_workout_at
      ? new Date(dbState.last_workout_at).toISOString()
      : null,
  };
}

// ── Fetch server game state ─────────────────────────────────────────────────

export async function fetchServerGameState(): Promise<{
  dbState: DBGameState | null;
  error: string | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { dbState: null, error: 'Nicht eingeloggt.' };

  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // PGRST116 = no rows found → new player, not an error
  if (error && error.code === 'PGRST116') {
    return { dbState: null, error: null };
  }
  if (error) return { dbState: null, error: error.message };
  return { dbState: data as DBGameState, error: null };
}

// ── Upload game state ───────────────────────────────────────────────────────

export async function uploadGameState(
  gameState: GameState,
  currentVersion: number,
): Promise<{ success: boolean; newVersion: number; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, newVersion: currentVersion, error: 'Nicht eingeloggt.' };

  const newVersion = currentVersion + 1;
  const dbData = gameStateToDBFormat(gameState, newVersion);

  const { error } = await supabase
    .from('game_states')
    .update({ ...dbData, synced_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) return { success: false, newVersion: currentVersion, error: error.message };
  if (config.verboseLogging) console.log(`[Sync] Uploaded v${newVersion}`);
  return { success: true, newVersion, error: null };
}

// ── Download game state ─────────────────────────────────────────────────────

export async function downloadGameState(): Promise<{
  gameState: GameState | null;
  version: number;
  error: string | null;
}> {
  const { dbState, error } = await fetchServerGameState();
  if (error) return { gameState: null, version: 0, error };
  if (!dbState) return { gameState: null, version: 0, error: null };

  const gameState = dbFormatToGameState(dbState);
  return { gameState, version: dbState.version, error: null };
}

// ── Main sync logic ─────────────────────────────────────────────────────────

export async function syncGameState(
  localState: GameState,
  localVersion: number,
  localUpdatedAt: Date,
): Promise<SyncResult> {
  try {
    const { dbState, error } = await fetchServerGameState();
    if (error) return { outcome: 'error', error };

    // Case 1: No server state with data → first upload
    if (!dbState || (dbState.version <= 1 && Object.keys(dbState.state_data ?? {}).length === 0)) {
      const upload = await uploadGameState(localState, localVersion);
      if (!upload.success) return { outcome: 'error', error: upload.error ?? undefined };
      return { outcome: 'first_upload', version: upload.newVersion };
    }

    const serverVersion = dbState.version;

    // Case 2: Local is newer
    if (localVersion > serverVersion) {
      const upload = await uploadGameState(localState, localVersion);
      if (!upload.success) return { outcome: 'error', error: upload.error ?? undefined };
      return { outcome: 'uploaded', version: upload.newVersion };
    }

    // Case 3: Server is newer
    if (serverVersion > localVersion) {
      const gameState = dbFormatToGameState(dbState);
      return { outcome: 'downloaded', gameState, version: serverVersion };
    }

    // Case 4: Same version — compare timestamps (5s tolerance)
    const serverUpdatedAt = new Date(dbState.updated_at);
    const diffMs = Math.abs(localUpdatedAt.getTime() - serverUpdatedAt.getTime());

    if (diffMs < 5000) {
      return { outcome: 'no_change', version: localVersion };
    }

    if (localUpdatedAt > serverUpdatedAt) {
      const upload = await uploadGameState(localState, localVersion);
      if (!upload.success) return { outcome: 'error', error: upload.error ?? undefined };
      return { outcome: 'uploaded', version: upload.newVersion };
    } else {
      const gameState = dbFormatToGameState(dbState);
      return { outcome: 'downloaded', gameState, version: serverVersion };
    }
  } catch (err) {
    return { outcome: 'error', error: (err as Error).message };
  }
}

// ── Workout log upload ──────────────────────────────────────────────────────

export async function uploadWorkoutLog(
  workout: { id: string; workoutType: string; date: string; durationMinutes: number; caloriesBurned: number; averageHeartRate: number | null },
  mmEarned: number,
  proteinEarned: number,
  steps: number,
  hrZone: string | null,
): Promise<{ success: boolean; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht eingeloggt.' };

  const { error } = await supabase.from('workout_logs').insert({
    user_id: user.id,
    workout_type: workout.workoutType,
    duration_min: workout.durationMinutes,
    active_kcal: workout.caloriesBurned,
    steps,
    avg_hr: workout.averageHeartRate,
    hr_zone: hrZone,
    mm_earned: mmEarned,
    protein_earned: proteinEarned,
    workout_date: workout.date.split('T')[0],
    healthkit_uuid: workout.id,
  });

  // Duplicate (23505) is OK
  if (error && error.code === '23505') return { success: true, error: null };
  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ── Weekly stats update ─────────────────────────────────────────────────────

export async function updateWeeklyStats(
  mmEarned: number,
  proteinEarned: number,
  minutes: number,
  kcal: number,
  steps: number,
  streak: number,
): Promise<{ success: boolean; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht eingeloggt.' };

  const { error } = await supabase.rpc('upsert_weekly_stats', {
    p_user_id: user.id,
    p_mm: mmEarned,
    p_protein: proteinEarned,
    p_minutes: minutes,
    p_kcal: kcal,
    p_steps: steps,
    p_streak: streak,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
