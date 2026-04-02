// SyncProvider.tsx
// FitRealm — Wrapper that triggers sync when gameState changes.

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useSyncManager } from '../hooks/useSyncManager';

interface SyncProviderProps {
  children: React.ReactNode;
}

export default function SyncProvider({ children }: SyncProviderProps) {
  const { requestSync } = useSyncManager();
  const gameState = useGameStore(s => s.gameState);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial mount — we don't want to trigger a sync for the initial state load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    requestSync();
  }, [gameState, requestSync]);

  return <>{children}</>;
}
