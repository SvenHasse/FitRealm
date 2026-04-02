// useSyncManager.ts
// FitRealm — Periodic + debounced game state sync hook.

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { syncGameState, SyncResult } from '../services/SyncService';

const SYNC_INTERVAL_MS = 60_000; // 60 s periodic sync
const DEBOUNCE_MS = 5_000;       // 5 s debounce after changes

export function useSyncManager() {
  const user = useAuthStore(s => s.user);
  const migrationComplete = useAuthStore(s => s.migrationComplete);
  const gameState = useGameStore(s => s.gameState);
  const syncVersion = useGameStore(s => s.syncVersion);
  const setSyncVersion = useGameStore(s => s.setSyncVersion);
  const loadGameState = useGameStore(s => s.loadGameState);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSync = useCallback(async () => {
    if (!user || !migrationComplete) return;

    const lastSyncedAt = useGameStore.getState().lastSyncedAt;
    const localUpdatedAt = lastSyncedAt ? new Date(lastSyncedAt) : new Date();
    const result: SyncResult = await syncGameState(gameState, syncVersion, localUpdatedAt);

    switch (result.outcome) {
      case 'uploaded':
      case 'first_upload':
        if (result.version != null) setSyncVersion(result.version);
        break;
      case 'downloaded':
        if (result.gameState && result.version != null) {
          loadGameState(result.gameState, result.version);
        }
        break;
      // 'no_change' | 'error' → do nothing
    }
  }, [user, migrationComplete, gameState, syncVersion, setSyncVersion, loadGameState]);

  // Debounced sync request — call this when the game state changes
  const requestSync = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(doSync, DEBOUNCE_MS);
  }, [doSync]);

  // Periodic sync
  useEffect(() => {
    if (!user || !migrationComplete) return;

    intervalRef.current = setInterval(doSync, SYNC_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, migrationComplete, doSync]);

  // AppState: sync on foreground / background
  useEffect(() => {
    if (!user || !migrationComplete) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        doSync();
      } else if (nextState === 'background') {
        doSync();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [user, migrationComplete, doSync]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { requestSync, doSync };
}
