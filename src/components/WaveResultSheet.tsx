// WaveResultSheet.tsx
// FitRealm — Shows the result of a completed monster wave combat

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { MonsterWave, WaveResult, DamageEffect, LootDrop, AppColors, BossPhaseResult } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameIcon, { GameIconName } from './GameIcon';
import { MONSTER_CONFIGS } from '../config/GameConfig';

interface Props {
  visible: boolean;
  wave: MonsterWave;
  result: WaveResult;
  defenseVP: number;
  effectiveAK: number;
  damages: DamageEffect[];
  loot: LootDrop[];
  nextWaveIn: number;  // Milliseconds until next wave
  onClose: () => void;
}

const OUTCOME_ICON_NAMES: Record<string, GameIconName> = {
  perfect: 'stamm',
  defended: 'shield-active',
  partial: 'quest',
  overrun: 'warning',
};

const OUTCOME_COLORS = {
  perfect: '#66BB6A',
  defended: '#42A5F5',
  partial: '#FFA726',
  overrun: '#EF5350',
} as const;

function LootItem({ drop, index }: { drop: LootDrop; index: number }) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = index * 200;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 350 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  let label = '';
  let iconName: GameIconName | null = null;
  let mciIcon: string | null = null;
  let mciColor = '#FFFFFF';
  switch (drop.type) {
    case 'holz':       mciIcon = 'pine-tree';      mciColor = '#8B6914'; label = `+${drop.amount} ${t('resources.wood')}`; break;
    case 'stein':      mciIcon = 'terrain';         mciColor = '#9A9E9B'; label = `+${drop.amount} ${t('resources.stone')}`; break;
    case 'nahrung':    mciIcon = 'sprout';           mciColor = '#7DB356'; label = `+${drop.amount} ${t('resources.food')}`; break;
    case 'muskelmasse':iconName = 'mm';                                    label = `+${drop.amount}g ${t('resources.muskelmasse')}`; break;
    case 'protein':    iconName = 'protein';                               label = `+${drop.amount} ${t('resources.protein')}`; break;
    case 'egg':        iconName = 'egg';                                   label = `${drop.eggRarity ?? t('animals.rarityCommon')} ${t('waves.egg')}`; break;
    case 'trophy':     iconName = 'trophy';                                label = t('waves.trophy'); break;
    case 'cosmetic':   mciIcon = 'star-four-points'; mciColor = '#E8A838'; label = t('waves.cosmetic'); break;
    default:           mciIcon = 'package-variant';  mciColor = '#9A9E9B'; label = `+${drop.amount}`; break;
  }

  return (
    <Animated.View style={[styles.lootItem, animStyle]}>
      {iconName
        ? <GameIcon name={iconName} size={18} />
        : <MaterialCommunityIcons name={mciIcon as any} size={18} color={mciColor} />
      }
      <Text style={styles.lootLabel}>{label}</Text>
    </Animated.View>
  );
}

function DamageItem({ effect }: { effect: DamageEffect }) {
  const { t } = useTranslation();
  const durationH = Math.round(effect.duration / (1000 * 60 * 60) * 10) / 10;
  let effectLabel = '';
  switch (effect.effectType) {
    case 'productionStop': effectLabel = t('waves.damageProductionStop', { hours: durationH }); break;
    case 'resourceLoss':   effectLabel = t('waves.damageResourceLoss'); break;
    case 'disabled':       effectLabel = t('waves.damageDisabled', { hours: durationH }); break;
  }
  return (
    <View style={styles.damageItem}>
      <GameIcon name="streak" size={16} />
      <Text style={styles.damageLabel}>
        {t('waves.damageBuilding', { id: effect.buildingId.slice(0, 8) })} — {effectLabel}
      </Text>
    </View>
  );
}

export default function WaveResultSheet({
  visible, wave, result, defenseVP, effectiveAK, damages, loot, nextWaveIn, onClose,
}: Props) {
  const { t } = useTranslation();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const outcome = result.outcome;
  const cfg = { iconName: OUTCOME_ICON_NAMES[outcome] ?? 'warning' as GameIconName, color: OUTCOME_COLORS[outcome] };
  const isBoss = result.isBossWave;
  const isBlood = result.isBloodWave;

  const nextWaveHours = Math.floor(nextWaveIn / (1000 * 60 * 60));

  const bossWon = isBoss && (outcome === 'perfect' || outcome === 'defended');
  const bossHeaderText = bossWon ? t('waves.bossDowned') : t('waves.bossDefeated');
  const bossHeaderColor = bossWon ? '#FFD700' : '#EF5350';
  const bossName = isBoss && wave.monsters.length > 0 ? t(MONSTER_CONFIGS[wave.monsters[0].type].nameKey) : '';

  const outcomeLabel =
    outcome === 'perfect' ? t('waves.resultPerfect') :
    outcome === 'defended' ? t('waves.resultDefended') :
    outcome === 'partial'  ? t('waves.resultPartial') :
                             t('waves.resultOverrun');

  const outcomeTip =
    outcome === 'partial' ? t('waves.tipPartial') :
    outcome === 'overrun' ? t('waves.tipOverrun') : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, isBoss && { borderWidth: 2, borderColor: '#FFD700' }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>

            {/* Blutwellen-Banner */}
            {isBlood && (
              <View style={styles.bloodBanner}>
                <Text style={styles.bloodBannerText}>{t('waves.bloodWaveBanner')}</Text>
              </View>
            )}

            {/* Header */}
            {isBoss ? (
              <View style={styles.header}>
                <Text style={[styles.headerLabel, { color: bossHeaderColor, fontSize: 24 }]}>
                  {bossHeaderText}
                </Text>
                <Text style={styles.bossName}>{bossName}</Text>
              </View>
            ) : (
              <View style={styles.header}>
                <GameIcon name={cfg.iconName} size={40} color={cfg.color} />
                <Text style={[styles.headerLabel, { color: cfg.color }]}>{outcomeLabel}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: isBoss ? '#FFD700' : cfg.color }]}>{defenseVP}</Text>
                <Text style={styles.statLabel}>{t('waves.yourVP')}</Text>
              </View>
              <Text style={styles.statSeparator}>vs</Text>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#EF5350' }]}>{effectiveAK}</Text>
                <Text style={styles.statLabel}>{t('waves.monsterAK')}</Text>
              </View>
            </View>

            {/* Boss-Phasen */}
            {isBoss && result.bossPhases && result.bossPhases.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>{t('waves.combatPhases')}</Text>
                {result.bossPhases.map((phase: BossPhaseResult) => (
                  <View key={phase.phase} style={styles.phaseRow}>
                    <GameIcon name={phase.passed ? 'check' : 'close'} size={16} />
                    <Text style={styles.phaseLabel}>{t('waves.phase', { n: phase.phase })}</Text>
                    <Text style={styles.phaseStats}>
                      {phase.vpUsed} VP vs {Math.round(phase.akFaced)} AK
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* VP Breakdown toggle (nur für normale Wellen) */}
            {!isBoss && (
              <>
                <TouchableOpacity
                  style={styles.breakdownToggle}
                  onPress={() => setShowBreakdown(s => !s)}
                >
                  <Text style={styles.breakdownToggleText}>
                    {showBreakdown ? t('waves.hideBreakdown') : t('waves.showBreakdown')}
                  </Text>
                </TouchableOpacity>

                {showBreakdown && (
                  <View style={styles.breakdownBox}>
                    <BreakdownRow label={t('waves.buildingVP')} value={result.playerVP} />
                    <BreakdownRow label={t('waves.workoutVP')} value={0} />
                    <BreakdownRow label={t('waves.workerVP')} value={0} />
                    <BreakdownRow label={t('waves.animalVP')} value={0} />
                    <View style={styles.breakdownDivider} />
                    <BreakdownRow label={t('waves.total')} value={defenseVP} bold />
                  </View>
                )}
              </>
            )}

            {/* Loot section */}
            {loot.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isBoss && { color: '#FFD700' }]}>
                  {isBoss && bossWon ? t('waves.legendaryLoot') : isBlood ? t('waves.bonusLoot') : t('waves.loot')}
                </Text>
                {loot.map((drop, i) => (
                  <LootItem key={i} drop={drop} index={i} />
                ))}
              </View>
            )}

            {/* Damage section */}
            {damages.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#EF5350' }]}>{t('waves.damage')}</Text>
                {damages.map((dmg, i) => (
                  <DamageItem key={i} effect={dmg} />
                ))}
              </View>
            )}

            {/* Monster info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('waves.monsters')}</Text>
              {wave.monsters.map((m, i) => {
                const mcfg = MONSTER_CONFIGS[m.type];
                return (
                  <View key={i} style={styles.monsterRow}>
                    <Text style={styles.monsterEmoji}>{mcfg.emoji}</Text>
                    <Text style={styles.monsterName}>{t(mcfg.nameKey)}</Text>
                    <Text style={styles.monsterCount}>{m.count}×</Text>
                    <Text style={styles.monsterAK}>AK: {m.attackPower}</Text>
                  </View>
                );
              })}
            </View>

            {/* Tip for loss */}
            {outcomeTip && !isBoss && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>{outcomeTip}</Text>
              </View>
            )}

            {/* Next wave */}
            <Text style={styles.nextWave}>
              {t('waves.nextWaveIn', { hours: nextWaveHours })}
            </Text>

            {/* Close button */}
            <TouchableOpacity
              style={[styles.closeBtn, isBoss && { backgroundColor: '#FFD700' }]}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>{t('common.continue')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BreakdownRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, bold && { fontWeight: 'bold', color: '#fff' }]}>{label}</Text>
      <Text style={[styles.breakdownValue, bold && { fontWeight: 'bold', color: '#fff' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  headerEmoji: { fontSize: 40 },
  headerLabel: { fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statSeparator: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  breakdownToggle: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  breakdownToggleText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  breakdownBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  breakdownValue: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  breakdownDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  section: {
    marginBottom: 16,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  lootItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(102,187,106,0.1)',
    borderRadius: 8,
  },
  lootEmoji: { fontSize: 18 },
  lootLabel: { fontSize: 14, color: '#66BB6A', fontWeight: '600' },
  damageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(239,83,80,0.1)',
    borderRadius: 8,
  },
  damageEmoji: { fontSize: 16 },
  damageLabel: { fontSize: 13, color: '#EF5350', flex: 1 },
  monsterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  monsterEmoji: { fontSize: 18 },
  monsterName: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  monsterCount: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  monsterAK: { fontSize: 12, color: '#EF5350' },
  tipBox: {
    backgroundColor: 'rgba(255,167,38,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA726',
  },
  tipText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },
  nextWave: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  bloodBanner: {
    backgroundColor: 'rgba(183,28,28,0.4)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(183,28,28,0.8)',
  },
  bloodBannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF9A9A',
    letterSpacing: 2,
  },
  bossName: {
    fontSize: 14,
    color: 'rgba(255,215,0,0.8)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,215,0,0.07)',
    borderRadius: 8,
    marginBottom: 4,
  },
  phaseIcon: { fontSize: 16 },
  phaseLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1 },
  phaseStats: { fontSize: 12, color: 'rgba(255,215,0,0.8)' },
  closeBtn: {
    backgroundColor: AppColors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
