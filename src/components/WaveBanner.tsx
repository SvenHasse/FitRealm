// WaveBanner.tsx
// FitRealm — Animated warning banner shown when a monster wave is approaching or active

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { MonsterWave } from '../models/types';
import { MONSTER_CONFIGS } from '../config/EntityConfig';

interface Props {
  wave: MonsterWave;
  defenseVP: number;
  onDetails: () => void;
  onPrepare: () => void;
  isBloodWave?: boolean;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'JETZT';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function WaveBanner({ wave, defenseVP, onDetails, onPrepare, isBloodWave }: Props) {
  const [timeLeft, setTimeLeft] = useState(wave.arrivesAt - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(wave.arrivesAt - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [wave.arrivesAt]);

  // Pulse animation — Blutwellen pulsen schneller
  const opacity = useSharedValue(1);
  useEffect(() => {
    const dur = isBloodWave ? 400 : 800;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: dur }),
        withTiming(1.0, { duration: dur }),
      ),
      -1,
      false,
    );
  }, [isBloodWave]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const totalAK = wave.totalAttackPower;
  const isDefending = defenseVP >= totalAK;
  const vpColor = isDefending ? '#66BB6A' : '#EF5350';

  const containerStyle = isBloodWave
    ? [styles.container, styles.bloodContainer]
    : [styles.container];

  return (
    <View style={containerStyle}>
      <Animated.View style={[styles.header, animStyle]}>
        <Text style={[styles.warningText, isBloodWave && styles.bloodWarningText]}>
          {isBloodWave ? '🩸 Blutwelle nähert sich!' : 'Monsterwelle naht!'}
        </Text>
        <Text style={styles.countdown}>{formatCountdown(timeLeft)}</Text>
      </Animated.View>

      {/* Monster list */}
      <View style={styles.monsterRow}>
        {wave.monsters.map((m, i) => {
          const cfg = MONSTER_CONFIGS[m.type];
          return (
            <View key={i} style={styles.monsterChip}>
              <Text style={styles.monsterEmoji}>{cfg.emoji}</Text>
              <Text style={styles.monsterText}>{m.count}× {cfg.name}</Text>
            </View>
          );
        })}
      </View>

      {/* VP vs AK preview */}
      <View style={styles.statsRow}>
        <Text style={[styles.vpText, { color: vpColor }]}>
          VP: {defenseVP}
        </Text>
        <Text style={styles.separator}>vs</Text>
        <Text style={styles.akText}>AK: {totalAK}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.detailsBtn} onPress={onDetails}>
          <Text style={styles.detailsBtnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.prepareBtn} onPress={onPrepare}>
          <Text style={styles.prepareBtnText}>Vorbereiten</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239,83,80,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,83,80,0.5)',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    gap: 6,
  },
  bloodContainer: {
    backgroundColor: 'rgba(183,28,28,0.25)',
    borderColor: 'rgba(183,28,28,0.8)',
  },
  bloodWarningText: {
    color: '#EF9A9A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EF5350',
  },
  countdown: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF8A80',
  },
  monsterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  monsterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,83,80,0.12)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  monsterEmoji: { fontSize: 12 },
  monsterText: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vpText: { fontSize: 12, fontWeight: 'bold' },
  separator: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  akText: { fontSize: 12, fontWeight: 'bold', color: '#EF5350' },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,83,80,0.4)',
    alignItems: 'center',
  },
  detailsBtnText: { fontSize: 12, color: '#EF5350', fontWeight: '600' },
  prepareBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239,83,80,0.3)',
    alignItems: 'center',
  },
  prepareBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
});
