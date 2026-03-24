// DailyMetricCard.tsx
// Shows one daily metric (steps / calories / workout time) with an optional
// circular progress ring and a 0→value counter animation on mount.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CircularProgressRing from './CircularProgressRing';
import { AppColors } from '../models/types';

// Plain JS counter – reliable on all RN versions
function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const steps = 60;
    const ms = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setVal(Math.min(Math.floor((target / steps) * step), target));
      if (step >= steps) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  unit?: string;
  color: string;
  /** Pass 0–1 to show a circular ring; omit for a plain icon circle */
  progress?: number;
  ringSize?: number;
}

export default function DailyMetricCard({
  icon,
  value,
  label,
  unit = '',
  color,
  progress,
  ringSize = 88,
}: Props) {
  const display = useCountUp(value);

  const inner = (
    <View style={styles.inner}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.value, { color }]}>{display.toLocaleString('de-DE')}</Text>
      {unit ? <Text style={[styles.unit, { color }]}>{unit}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {progress !== undefined ? (
        <CircularProgressRing size={ringSize} progress={progress} color={color} strokeWidth={7}>
          {inner}
        </CircularProgressRing>
      ) : (
        <View style={[styles.plainRing, { borderColor: `${color}60`, width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
          {inner}
        </View>
      )}
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, gap: 8 },
  inner: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  value: { fontSize: 17, fontWeight: 'bold' },
  unit: { fontSize: 11, fontWeight: '500', opacity: 0.85 },
  label: { fontSize: 11, color: AppColors.textSecondary, textAlign: 'center', paddingHorizontal: 4 },
  plainRing: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
