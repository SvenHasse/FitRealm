// DefenseDashboardModal.tsx
// FitRealm — Full-screen defense overview with VP breakdown, next wave, tips, and animal assignment

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { AppColors } from '../models/types';
import { ANIMAL_CONFIGS, DEFENSE_CONFIG } from '../config/EntityConfig';
import { formatDuration } from '../utils/formatDuration';

const SCREEN_H     = Dimensions.get('window').height;
const DEFENSE_COLOR = '#E879F9';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function waveCountdown(endsAt: number): string | null {
  const rem = Math.max(0, (endsAt - Date.now()) / 1000);
  if (rem <= 0) return null;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} Min`;
  return formatDuration(Math.floor(rem));
}

export default function DefenseDashboardModal({ visible, onClose }: Props) {
  const store     = useGameStore();
  const { t }     = useTranslation();
  const { gameState } = store;

  const defense = store.calculateDefense();
  const { totalVP, basisVP, workoutVP, workerVP, animalVP, streakBonus } = defense;

  // Next wave timing
  const activeWave = gameState.activeWave;
  const nextWaveAt = gameState.nextWaveAt;
  const waveTarget  = activeWave?.arrivesAt ?? nextWaveAt;
  const nextWaveAK  = activeWave?.totalAttackPower
    ?? Math.round(DEFENSE_CONFIG.buildingVP.rathaus * 5 * (gameState.buildings.find(b => b.type === 'rathaus')?.level ?? 1));

  const [waveTime, setWaveTime] = useState(() => waveTarget ? waveCountdown(waveTarget) : null);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setWaveTime(waveTarget ? waveCountdown(waveTarget) : null), 60_000);
    return () => clearInterval(id);
  }, [visible, waveTarget]);

  // VP status thresholds
  const vpRatio = nextWaveAK > 0 ? totalVP / nextWaveAK : 2;
  let statusText: string;
  let statusColor: string;
  if (vpRatio >= 1.5)      { statusText = t('defense.statusPerfect'); statusColor = '#4ADE80'; }
  else if (vpRatio >= 1.0) { statusText = t('defense.statusGood');    statusColor = '#00B4D8'; }
  else if (vpRatio >= 0.5) { statusText = t('defense.statusWarning'); statusColor = '#F5A623'; }
  else                     { statusText = t('defense.statusDanger');  statusColor = '#FF6B6B'; }

  // Workout minutes in last 24h
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
  const workoutMinutesToday = store.recentWorkouts
    .filter(w => new Date(w.date).getTime() >= cutoff24h)
    .reduce((sum, w) => sum + w.durationMinutes, 0);

  // Building VP breakdown (only defense buildings)
  const buildingBreakdown = gameState.buildings
    .filter(b => b.level >= 1 && !b.isUnderConstruction && DEFENSE_CONFIG.buildingVP[b.type])
    .map(b => ({
      type: b.type as string,
      vp: DEFENSE_CONFIG.buildingVP[b.type] * b.level,
    }));

  // Animals in defense
  const animalsInDefense = gameState.animals
    .filter(a => a.assignment.type === 'defense')
    .map(a => ({ id: a.id, emoji: ANIMAL_CONFIGS[a.type].emoji, name: ANIMAL_CONFIGS[a.type].name, vp: ANIMAL_CONFIGS[a.type].defenseVP }));

  // Tips
  const hasWachturm  = gameState.buildings.some(b => b.type === 'wachturm' && b.level >= 1 && !b.isUnderConstruction);
  const idleAnimals  = gameState.animals.filter(a => a.assignment.type === 'idle' && ANIMAL_CONFIGS[a.type].defenseVP > 0);
  const rathausLevel = gameState.buildings.find(b => b.type === 'rathaus')?.level ?? 1;

  const tips: string[] = [];
  if (workoutMinutesToday < 30) {
    const vpGain = (30 - workoutMinutesToday) * DEFENSE_CONFIG.vpPerWorkoutMinute;
    tips.push(t('defense.tipTrain', { minutes: 30, vp: vpGain }));
  }
  if (idleAnimals.length > 0) {
    tips.push(t('defense.tipIdleAnimals', { count: idleAnimals.length }));
  }
  if (!hasWachturm && rathausLevel >= 2) {
    tips.push(t('defense.tipBuildWachturm', { vp: DEFENSE_CONFIG.buildingVP.wachturm }));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={'shield-checkmark' as any} size={22} color={DEFENSE_COLOR} />
              <Text style={styles.headerTitle}>{t('defense.title')}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: AppColors.gold, fontWeight: '600' }}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── Section 1: Hero VP Card ── */}
            <View style={[styles.card, { borderWidth: 1, borderColor: `${statusColor}50` }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name={'shield' as any} size={16} color={DEFENSE_COLOR} />
                <Text style={styles.sectionLabel}>{t('defense.subtitle').toUpperCase()}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[styles.vpBig, { color: statusColor }]}>{t('defense.totalVP', { vp: totalVP })}</Text>
                <Text style={{ fontSize: 13, color: statusColor, fontWeight: '600', marginBottom: 6 }}>{statusText}</Text>
              </View>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                {t('defense.vsNextWave', { ak: nextWaveAK })}
              </Text>
              {/* Progress bar — fill up to 67% of bar width = "enough" */}
              <View style={{ height: 8, backgroundColor: '#1A1C2A', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{
                  height: 8, borderRadius: 4,
                  width: `${Math.min(Math.round(vpRatio * 67), 100)}%` as any,
                  backgroundColor: statusColor,
                }} />
              </View>
            </View>

            {/* ── Section 2: VP Breakdown 2×2 Grid ── */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 10 }}>
                {/* 🏗️ Gebäude */}
                <View style={[styles.card, styles.breakdownCard]}>
                  <Text style={styles.breakdownEmoji}>🏗️</Text>
                  <Text style={styles.breakdownLabel}>{t('defense.buildingVP')}</Text>
                  <Text style={styles.breakdownVP}>{basisVP} VP</Text>
                  <Text style={styles.breakdownDetail} numberOfLines={3}>
                    {buildingBreakdown.length > 0
                      ? buildingBreakdown.map(b =>
                          `${b.type[0].toUpperCase() + b.type.slice(1)} +${b.vp}`,
                        ).join(' · ')
                      : '—'}
                  </Text>
                </View>
                {/* 👷 Worker */}
                <View style={[styles.card, styles.breakdownCard]}>
                  <Text style={styles.breakdownEmoji}>👷</Text>
                  <Text style={styles.breakdownLabel}>{t('defense.workerVP')}</Text>
                  <Text style={styles.breakdownVP}>{workerVP} VP</Text>
                  <Text style={styles.breakdownDetail}>{t('defense.comingSoon')}</Text>
                </View>
              </View>
              <View style={{ flex: 1, gap: 10 }}>
                {/* 💪 Workout */}
                <View style={[styles.card, styles.breakdownCard]}>
                  <Text style={styles.breakdownEmoji}>💪</Text>
                  <Text style={styles.breakdownLabel}>{t('defense.workoutVP')}</Text>
                  <Text style={styles.breakdownVP}>{workoutVP} VP</Text>
                  <Text style={styles.breakdownDetail}>
                    {workoutMinutesToday} Min · {t('defense.last24h')}
                  </Text>
                </View>
                {/* 🐾 Tiere */}
                <View style={[styles.card, styles.breakdownCard]}>
                  <Text style={styles.breakdownEmoji}>🐾</Text>
                  <Text style={styles.breakdownLabel}>{t('defense.animalVP')}</Text>
                  <Text style={styles.breakdownVP}>{animalVP} VP</Text>
                  <Text style={styles.breakdownDetail} numberOfLines={3}>
                    {animalsInDefense.length > 0
                      ? animalsInDefense.map(a => `${a.emoji} ${a.name}`).join(' · ')
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Streak bonus row */}
            {streakBonus > 0 && (
              <View style={styles.streakRow}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <Text style={{ fontSize: 12, color: AppColors.gold }}>
                  {t('defense.streakBonus', { pct: Math.round(streakBonus * 100) })}
                  {' '}({gameState.currentStreak} {t('hud.streak')})
                </Text>
              </View>
            )}

            {/* ── Section 3: Nächste Welle ── */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>👾</Text>
                <Text style={styles.sectionLabel}>{t('defense.nextWave').toUpperCase()}</Text>
              </View>
              {waveTarget ? (
                <>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 }}>
                    {t('defense.waveIn', { time: waveTime ?? t('construction.instant') })}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {t('defense.estimatedStrength', { ak: nextWaveAK })}
                  </Text>
                  {activeWave && (activeWave.arrivesAt - Date.now() < 2 * 3600 * 1000) && (
                    <View style={styles.waveWarning}>
                      <Ionicons name={'warning' as any} size={14} color="#FF6B6B" />
                      <Text style={{ fontSize: 12, color: '#FF6B6B', fontWeight: '600' }}>
                        {t('defense.waveImminent')}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  {t('defense.noWave')}
                </Text>
              )}
            </View>

            {/* ── Section 4: Tipps ── */}
            {tips.length > 0 && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ionicons name={'bulb-outline' as any} size={16} color={AppColors.gold} />
                  <Text style={styles.sectionLabel}>{t('defense.tips').toUpperCase()}</Text>
                </View>
                {tips.slice(0, 3).map((tip, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 6,
                    padding: 8, backgroundColor: 'rgba(245,166,35,0.07)', borderRadius: 10 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', flex: 1, lineHeight: 18 }}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Section 5: Tiere in der Verteidigung (read-only) ── */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name={'shield-checkmark-outline' as any} size={16} color="#00B4D8" />
                <Text style={styles.sectionLabel}>{t('animalSection.defenseTitle').toUpperCase()}</Text>
              </View>

              {animalsInDefense.length === 0 ? (
                <>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                    {t('animalSection.defenseEmpty')}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                    {t('animalSection.defenseHint')}
                  </Text>
                </>
              ) : (
                animalsInDefense.map((animal, i) => {
                  const isLast = i === animalsInDefense.length - 1;
                  return (
                    <View key={animal.id} style={[styles.animalRow, !isLast && styles.animalRowDivider]}>
                      <Text style={{ fontSize: 22 }}>{animal.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{animal.name}</Text>
                        <Text style={{ fontSize: 10, color: DEFENSE_COLOR }}>
                          ⚔️ {t('defense.assignment')} · {animal.vp} VP
                        </Text>
                      </View>
                      <View style={styles.vpBadge}>
                        <Text style={styles.vpBadgeText}>+{animal.vp} VP</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    height: SCREEN_H * 0.85,
    backgroundColor: '#1A1C2A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginTop: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  scrollContent: { padding: 16, gap: 12 },
  card: { backgroundColor: '#252547', borderRadius: 16, padding: 14 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8,
  },
  vpBig: { fontSize: 42, fontWeight: 'bold' },
  breakdownCard: { flex: 1, minHeight: 108 },
  breakdownEmoji: { fontSize: 22, marginBottom: 4 },
  breakdownLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  breakdownVP: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  breakdownDetail: { fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 13 },
  streakRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(245,166,35,0.1)', borderRadius: 12,
  },
  waveWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    padding: 8, backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 10,
  },
  animalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  animalRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  assignBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(232,121,249,0.1)',
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(232,121,249,0.25)',
  },
  assignBtnActive: {
    backgroundColor: 'rgba(232,121,249,0.08)',
    borderColor: 'rgba(232,121,249,0.45)',
  },
  assignBtnText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  vpBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(0,180,216,0.15)',
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(0,180,216,0.35)',
  },
  vpBadgeText: { fontSize: 11, fontWeight: '700', color: '#00B4D8' },
});
