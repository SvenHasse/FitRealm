// WaveDetailSheet.tsx
// FitRealm — Shows detailed information about an approaching monster wave

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MonsterWave, DefenseBreakdown, AppColors } from '../models/types';
import { MONSTER_CONFIGS } from '../config/GameConfig';

interface Props {
  visible: boolean;
  wave: MonsterWave;
  defense: DefenseBreakdown;
  onClose: () => void;
}

function getRecommendations(wave: MonsterWave, defense: DefenseBreakdown, t: (k: string) => string): string[] {
  const tips: string[] = [];
  const gap = wave.totalAttackPower - defense.totalVP;

  if (gap > 0) {
    tips.push(t('waves.tipAssignAnimals'));
  }
  if (defense.workoutVP < 20) {
    tips.push(t('waves.tipTrainToday'));
  }
  const hasSpaehfalke = defense.animalVP > 0;
  if (!hasSpaehfalke) {
    tips.push(t('waves.tipSpaehfalke'));
  }
  if (defense.basisVP < 30) {
    tips.push(t('waves.tipBuildDefense'));
  }
  if (defense.streakBonus < 0.1) {
    tips.push(t('waves.tipStreak'));
  }

  return tips.slice(0, 3);
}

export default function WaveDetailSheet({ visible, wave, defense, onClose }: Props) {
  const { t } = useTranslation();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const tips = getRecommendations(wave, defense, t);
  const isDefended = defense.totalVP >= wave.totalAttackPower;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('waves.detailTitle')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryBox, { borderColor: '#EF5350' }]}>
                <Text style={[styles.summaryValue, { color: '#EF5350' }]}>{wave.totalAttackPower}</Text>
                <Text style={styles.summaryLabel}>{t('waves.monsterAK')}</Text>
              </View>
              <Text style={styles.vsText}>vs</Text>
              <View style={[styles.summaryBox, { borderColor: isDefended ? '#66BB6A' : '#FFA726' }]}>
                <Text style={[styles.summaryValue, { color: isDefended ? '#66BB6A' : '#FFA726' }]}>
                  {defense.totalVP}
                </Text>
                <Text style={styles.summaryLabel}>{t('waves.yourVP')}</Text>
              </View>
            </View>

            {/* Outcome prediction */}
            <View style={[styles.predictionBadge, { backgroundColor: isDefended ? 'rgba(102,187,106,0.15)' : 'rgba(239,83,80,0.15)' }]}>
              <Text style={[styles.predictionText, { color: isDefended ? '#66BB6A' : '#EF5350' }]}>
                {isDefended
                  ? defense.totalVP >= wave.totalAttackPower * 1.5
                    ? t('waves.predictPerfect')
                    : t('waves.predictWin')
                  : defense.totalVP >= wave.totalAttackPower * 0.5
                    ? t('waves.predictPartial')
                    : t('waves.predictLoss')}
              </Text>
            </View>

            {/* Monster list */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('waves.monstersInWave')}</Text>
              {wave.monsters.map((m, i) => {
                const cfg = MONSTER_CONFIGS[m.type];
                return (
                  <View key={i} style={styles.monsterRow}>
                    <Text style={styles.monsterEmoji}>{cfg.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.monsterName}>{t(cfg.nameKey)}</Text>
                      <Text style={styles.monsterTarget}>{t('waves.target')}: {cfg.target}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.monsterCount}>{t('waves.unitCount', { count: m.count })}</Text>
                      <Text style={styles.monsterAK}>{t('waves.akPerUnit', { ak: m.attackPower })}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* VP Breakdown */}
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
                <BRow label={t('waves.buildingVP')} value={defense.basisVP} />
                <BRow label={t('waves.workoutVP')} value={defense.workoutVP} />
                <BRow label={t('waves.workerVP')} value={defense.workerVP} />
                <BRow label={t('waves.animalVP')} value={defense.animalVP} />
                <BRow label={t('waves.streakBonusRow', { pct: Math.round(defense.streakBonus * 100) })} value={0} />
                <View style={styles.breakdownDivider} />
                <BRow label={t('waves.total')} value={defense.totalVP} bold />
              </View>
            )}

            {/* Recommendations */}
            {tips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('waves.recommendations')}</Text>
                {tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.brow}>
      <Text style={[styles.browLabel, bold && { fontWeight: 'bold', color: '#fff' }]}>{label}</Text>
      <Text style={[styles.browValue, bold && { fontWeight: 'bold', color: '#fff' }]}>{value}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  closeText: { fontSize: 14, color: AppColors.gold, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  summaryBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  summaryValue: { fontSize: 26, fontWeight: 'bold' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  vsText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  predictionBadge: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionText: { fontSize: 14, fontWeight: 'bold' },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monsterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  },
  monsterEmoji: { fontSize: 22 },
  monsterName: { fontSize: 14, color: '#fff', fontWeight: '600' },
  monsterTarget: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  monsterCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  monsterAK: { fontSize: 11, color: '#EF5350', marginTop: 1 },
  breakdownToggle: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  breakdownToggleText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  breakdownBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  brow: { flexDirection: 'row', justifyContent: 'space-between' },
  browLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  browValue: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  breakdownDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  tipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  tipBullet: { fontSize: 14, color: '#FFA726' },
  tipText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1, lineHeight: 18 },
});
