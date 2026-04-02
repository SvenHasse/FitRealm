// MigrationService.ts
// FitRealm — One-time migration from AsyncStorage (local-only) to Supabase cloud save.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, createDefaultGameState, gameStateRathausLevel } from '../models/types';
import { fetchServerGameState, uploadGameState, dbFormatToGameState } from './SyncService';
import { config } from '../config/environment';

// ── Constants ───────────────────────────────────────────────────────────────

const MIGRATION_FLAG_KEY = '@fitrealm_migration_completed';
const ZUSTAND_GAME_STORE_KEY = 'fitrealm-game-store';

// ── Types ───────────────────────────────────────────────────────────────────

export interface MigrationSummary {
  rathausLevel: number;
  totalMM: number;
  streak: number;
  buildingCount: number;
  animalCount: number;
}

export type MigrationOutcome =
  | { type: 'new_player'; gameState: GameState }
  | { type: 'local_uploaded'; gameState: GameState }
  | { type: 'server_downloaded'; gameState: GameState }
  | { type: 'conflict'; localSummary: MigrationSummary; serverSummary: MigrationSummary; localState: GameState; serverState: GameState }
  | { type: 'already_migrated' }
  | { type: 'error'; message: string };

// ── Helpers ─────────────────────────────────────────────────────────────────

function summarizeState(state: GameState): MigrationSummary {
  return {
    rathausLevel: gameStateRathausLevel(state),
    totalMM: state.muskelmasse,
    streak: state.currentStreak,
    buildingCount: state.buildings.length,
    animalCount: state.animals.length,
  };
}

async function loadLocalGameState(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(ZUSTAND_GAME_STORE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Zustand persist wraps state in { state: { ... }, version: N }
    const stateData = parsed?.state ?? parsed;

    // Check if the gameState is nested (useGameStore pattern)
    const gs = stateData?.gameState ?? stateData;

    // Validate it looks like a GameState
    if (gs && typeof gs.muskelmasse === 'number' && Array.isArray(gs.buildings)) {
      return gs as GameState;
    }
    return null;
  } catch {
    return null;
  }
}

function serverHasRealData(stateData: Record<string, unknown>): boolean {
  // Check if state_data contains actual game progress
  const keys = Object.keys(stateData ?? {});
  if (keys.length === 0) return false;
  // If there are buildings, it has real data
  const buildings = stateData.buildings;
  if (Array.isArray(buildings) && buildings.length > 0) return true;
  // If streakTokens or other resources are set
  if (typeof stateData.streakTokens === 'number' && stateData.streakTokens > 0) return true;
  return false;
}

// ── Main Migration ──────────────────────────────────────────────────────────

export async function runMigration(): Promise<MigrationOutcome> {
  try {
    // 1. Check if already migrated
    const flag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (flag === 'true') {
      return { type: 'already_migrated' };
    }

    // 2. Load local state from AsyncStorage
    const localState = await loadLocalGameState();
    if (config.verboseLogging) {
      console.log('[Migration] Local state:', localState ? 'found' : 'none');
    }

    // 3. Check server state
    const { dbState, error } = await fetchServerGameState();
    if (error) return { type: 'error', message: error };

    const serverHasData = dbState
      ? (Number(dbState.current_mm) > 0 || serverHasRealData(dbState.state_data))
      : false;

    if (config.verboseLogging) {
      console.log('[Migration] Server state:', dbState ? (serverHasData ? 'has data' : 'empty') : 'none');
    }

    // 4. Decide
    const hasLocal = localState !== null && (localState.muskelmasse > 0 || localState.buildings.length > 0);

    // Case A: No local + no server → new player
    if (!hasLocal && !serverHasData) {
      const freshState = createDefaultGameState();
      return { type: 'new_player', gameState: freshState };
    }

    // Case B: Local exists + server empty → upload local
    if (hasLocal && !serverHasData) {
      const upload = await uploadGameState(localState!, 1);
      if (!upload.success) return { type: 'error', message: upload.error ?? 'Upload fehlgeschlagen' };
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { type: 'local_uploaded', gameState: localState! };
    }

    // Case C: No local + server has data → download
    if (!hasLocal && serverHasData && dbState) {
      const serverState = dbFormatToGameState(dbState);
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { type: 'server_downloaded', gameState: serverState };
    }

    // Case D: Both have data → conflict, let user decide
    if (hasLocal && serverHasData && dbState) {
      const serverState = dbFormatToGameState(dbState);
      return {
        type: 'conflict',
        localSummary: summarizeState(localState!),
        serverSummary: summarizeState(serverState),
        localState: localState!,
        serverState,
      };
    }

    // Fallback
    return { type: 'new_player', gameState: createDefaultGameState() };
  } catch (err) {
    return { type: 'error', message: (err as Error).message };
  }
}

// ── Resolve Conflict ────────────────────────────────────────────────────────

export async function resolveConflict(
  chosenState: GameState,
  source: 'local' | 'server',
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (source === 'local') {
      // Upload local state to server
      const upload = await uploadGameState(chosenState, 1);
      if (!upload.success) return { success: false, error: upload.error };
    }
    // If source === 'server', the state is already on the server, just accept it

    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
