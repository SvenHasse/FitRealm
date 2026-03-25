// WaveResultSheet.tsx
// FitRealm — Shows the result of a completed monster wave combat

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { MonsterWave, WaveResult, DamageEffect, LootDrop, AppColors } from '../models/types';
import { MONSTER_CONFIGS } from '../config/EntityConfig';

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

const OUTCOME_CONFIG = {
  perfect: {
    emoji: '⚔️',
    label: 'PERFEKT VERTEIDIGT!',
    color: '#66BB6A',
    tip: null,
  },
  defended: {
    emoji: '🛡️',
    label: 'VERTEIDIGT!',
    color: '#42A5F5',
    tip: null,
  },
  partial: {
    emoji: '⚡',
    label: 'TEILWEISE VERTEIDIGT',
    color: '#FFA726',
    tip: 'Tipp: Weise mehr Tiere der Verteidigung zu und trainiere regelmäßig!',
  },
  overrun: {
    emoji: '💀',
    label: 'ÜBERRANNT!',
    color: '#EF5350',
    tip: 'Tipp: Baue Mauern und Wachtürme auf, und trainiere täglich für mehr Verteidigungspunkte!',
  },
};

function LootItem({ drop, index }: { drop: LootDrop; index: number }) {
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
  let emoji = '';
  switch (drop.type) {
    case 'holz': emoji = '🪵'; label = `+${drop.amount} Holz`; break;
    case 'stein': emoji = '🪨'; label = `+${drop.amount} Stein`; break;
    case 'nahrung': emoji = '🌾'; label = `+${drop.amount} Nahrung`; break;
    case 'muskelmasse': emoji = '💪'; label = `+${drop.amount}g Muskelmasse`; break;
    case 'protein': emoji = '💊'; label = `+${drop.amount} Protein`; break;
    case 'egg': emoji = '🥚'; label = `${drop.eggRarity ?? 'Gewöhnliches'} Ei`; break;
    case 'trophy': emoji = '🏆'; label = `Trophäe`; break;
    case 'cosmetic': emoji = '✨'; label = `Kosmetik`; break;
    default: emoji = '📦'; label = `+${drop.amount}`; break;
  }

  return (
    <Animated.View style={[styles.lootItem, animStyle]}>
      <Text style={styles.lootEmoji}>{emoji}</Text>
      <Text style={styles.lootLabel}>{label}</Text>
    </Animated.View>
  );
}

function DamageItem({ effect, buildings }: { effect: DamageEffect; buildings?: { id: string; type: string }[] }) {
  const durationH = Math.round(effect.duration / (1000 * 60 * 60) * 10) / 10;
  let effectLabel = '';
  switch (effect.effectType) {
    case 'productionStop': effectLabel = `Produktion gestoppt (${durationH}h)`; break;
    case 'resourceLoss': effectLabel = 'Ressourcen verloren'; break;
    case 'disabled': effectLabel = `Deaktiviert (${durationH}h)`; break;
  }
  return (
    <View style={styles.damageItem}>
      <Text style={styles.damageEmoji}>🔥</Text>
      <Text style={styles.damageLabel}>
        Gebäude {effect.buildingId.slice(0, 8)}... — {effectLabel}
      </Text>
    </View>
  );
}

export default function WaveResultSheet({
  visible, wave, result, defenseVP, effectiveAK, damages, loot, nextWaveIn, onClose,
}: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const cfg = OUTCOME_CONFIG[result.outcome];

  const nextWaveHours = Math.floor(nextWaveIn / (1000 * 60 * 60));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.headerLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: cfg.color }]}>{defenseVP}</Text>
                <Text style={styles.statLabel}>Deine VP</Text>
              </View>
              <Text style={styles.statSeparator}>vs</Text>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#EF5350' }]}>{effectiveAK}</Text>
                <Text style={styles.statLabel}>Monster AK</Text>
              </View>
            </View>

            {/* VP Breakdown toggle */}
            <TouchableOpacity
              style={styles.breakdownToggle}
              onPress={() => setShowBreakdown(s => !s)}
            >
              <Text style={styles.breakdownToggleText}>
                {showBreakdown ? 'VP-Aufschlüsselung verbergen ▲' : 'VP-Aufschlüsselung anzeigen ▼'}
              </Text>
            </TouchableOpacity>

            {showBreakdown && (
              <View style={styles.breakdownBox}>
                <BreakdownRow label="Gebäude-VP" value={result.playerVP} />
                <BreakdownRow label="Workout-VP" value={0} />
                <BreakdownRow label="Worker-VP" value={0} />
                <BreakdownRow label="Tier-VP" value={0} />
                <View style={styles.breakdownDivider} />
                <BreakdownRow label="Gesamt" value={defenseVP} bold />
              </View>
            )}

            {/* Loot section */}
            {loot.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Beute</Text>
                {loot.map((drop, i) => (
                  <LootItem key={i} drop={drop} index={i} />
                ))}
              </View>
            )}

            {/* Damage section */}
            {damages.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#EF5350' }]}>Schaden</Text>
                {damages.map((dmg, i) => (
                  <DamageItem key={i} effect={dmg} />
                ))}
              </View>
            )}

            {/* Monster info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monster</Text>
              {wave.monsters.map((m, i) => {
                const mcfg = MONSTER_CONFIGS[m.type];
                return (
                  <View key={i} style={styles.monsterRow}>
                    <Text style={styles.monsterEmoji}>{mcfg.emoji}</Text>
                    <Text style={styles.monsterName}>{mcfg.name}</Text>
                    <Text style={styles.monsterCount}>{m.count}×</Text>
                    <Text style={styles.monsterAK}>AK: {m.attackPower}</Text>
                  </View>
                );
              })}
            </View>

            {/* Tip for loss */}
            {cfg.tip && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>{cfg.tip}</Text>
              </View>
            )}

            {/* Next wave */}
            <Text style={styles.nextWave}>
              Nächste Welle in ~{nextWaveHours}h
            </Text>

            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Weiter</Text>
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
  closeBtn: {
    backgroundColor: AppColors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
