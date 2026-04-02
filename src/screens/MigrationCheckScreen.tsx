// MigrationCheckScreen.tsx
// FitRealm — Auto-runs migration on first login, shows conflict dialog if needed.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { runMigration, MigrationOutcome, MigrationSummary, resolveConflict } from '../services/MigrationService';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { AppColors } from '../models/types';

type Phase = 'running' | 'conflict' | 'error';

export default function MigrationCheckScreen() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const setMigrationComplete = useAuthStore(s => s.setMigrationComplete);
  const loadGameState = useGameStore(s => s.loadGameState);

  const [phase, setPhase] = useState<Phase>('running');
  const [outcome, setOutcome] = useState<MigrationOutcome | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const completeMigration = useCallback((gs: import('../models/types').GameState, version: number) => {
    loadGameState(gs, version);
    setMigrationComplete();
  }, [loadGameState, setMigrationComplete]);

  const doMigration = useCallback(async () => {
    if (!user) return;
    setPhase('running');
    setErrorMsg('');

    const result = await runMigration();

    switch (result.type) {
      case 'new_player':
      case 'local_uploaded':
      case 'server_downloaded':
        completeMigration(result.gameState, 1);
        break;
      case 'already_migrated':
        setMigrationComplete();
        break;
      case 'conflict':
        setOutcome(result);
        setPhase('conflict');
        break;
      case 'error':
        setErrorMsg(result.message);
        setPhase('error');
        break;
    }
  }, [user, completeMigration, setMigrationComplete]);

  useEffect(() => {
    doMigration();
  }, [doMigration]);

  const handleResolve = async (choice: 'local' | 'server') => {
    if (!user || !outcome || outcome.type !== 'conflict') return;
    setPhase('running');

    const chosenState = choice === 'local' ? outcome.localState : outcome.serverState;
    const result = await resolveConflict(chosenState, choice);

    if (result.success) {
      completeMigration(chosenState, 1);
    } else {
      setErrorMsg(result.error ?? t('migration.unknownError'));
      setPhase('error');
    }
  };

  const handleSkipOffline = () => {
    // Let the user proceed with local state without syncing
    setMigrationComplete();
  };

  // ── Conflict card ──────────────────────────────────────────────────────
  const SummaryCard = ({ title, summary, onPress }: { title: string; summary: MigrationSummary; onPress: () => void }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardRow}>{t('migration.rathausLevel')}: {summary.rathausLevel}</Text>
      <Text style={styles.cardRow}>{t('migration.totalMM')}: {Math.round(summary.totalMM)}</Text>
      <Text style={styles.cardRow}>{t('migration.streak')}: {summary.streak}</Text>
      <Text style={styles.cardRow}>{t('migration.buildings')}: {summary.buildingCount}</Text>
      <Text style={styles.cardRow}>{t('migration.animals')}: {summary.animalCount}</Text>
      <View style={styles.cardBtn}>
        <Text style={styles.cardBtnText}>{t('migration.choose')}</Text>
      </View>
    </TouchableOpacity>
  );

  // ── Running ────────────────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={AppColors.gold} />
        <Text style={styles.statusText}>{t('migration.running')}</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <View style={styles.container}>
        <Ionicons name="warning" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={doMigration}>
          <Text style={styles.retryBtnText}>{t('migration.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkipOffline}>
          <Text style={styles.skipBtnText}>{t('migration.skipOffline')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Conflict ───────────────────────────────────────────────────────────
  if (phase === 'conflict' && outcome && outcome.type === 'conflict') {
    return (
      <View style={styles.container}>
        <Ionicons name="git-compare" size={48} color={AppColors.gold} />
        <Text style={styles.conflictTitle}>{t('migration.conflictTitle')}</Text>
        <Text style={styles.conflictSubtitle}>{t('migration.conflictSubtitle')}</Text>
        <View style={styles.cardRow2}>
          <SummaryCard
            title={t('migration.localDevice')}
            summary={outcome.localSummary}
            onPress={() => handleResolve('local')}
          />
          <SummaryCard
            title={t('migration.serverCloud')}
            summary={outcome.serverSummary}
            onPress={() => handleResolve('server')}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: AppColors.background,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  statusText: { color: AppColors.textSecondary, fontSize: 16, marginTop: 16 },
  errorText: { color: '#FF6B6B', fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryBtn: {
    backgroundColor: AppColors.gold, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14,
    marginBottom: 12,
  },
  retryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  skipBtn: { paddingVertical: 10 },
  skipBtnText: { color: AppColors.textSecondary, fontSize: 14 },
  conflictTitle: { color: AppColors.textPrimary, fontSize: 22, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  conflictSubtitle: { color: AppColors.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 20, textAlign: 'center' },
  cardRow2: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1, backgroundColor: AppColors.cardBackground, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: { color: AppColors.gold, fontWeight: 'bold', fontSize: 15, marginBottom: 10 },
  cardRow: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 4 },
  cardBtn: {
    backgroundColor: AppColors.gold, borderRadius: 8, paddingVertical: 10,
    alignItems: 'center', marginTop: 12,
  },
  cardBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});
