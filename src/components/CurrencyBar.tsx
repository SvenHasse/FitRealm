// CurrencyBar.tsx
// Horizontal currency display: Muskelmasse · Protein · Streak Tokens.
// Reads exclusively from the global gameStore.
// Values animate with a count-up whenever they increase.

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { AppColors } from '../models/types';

// ─── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, durationMs = 800): number {
  const [displayed, setDisplayed] = useState(target);
  const prevRef   = useRef(target);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;

    if (from === target) return;

    // Clear any in-progress animation
    if (timerRef.current) clearInterval(timerRef.current);

    const STEPS    = 40;
    const interval = durationMs / STEPS;
    let count      = 0;

    timerRef.current = setInterval(() => {
      count++;
      const t = count / STEPS;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (target - from) * eased));
      if (count >= STEPS) {
        clearInterval(timerRef.current!);
        setDisplayed(target);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [target, durationMs]);

  return displayed;
}

// ─── Single currency slot ─────────────────────────────────────────────────────

interface SlotProps {
  icon:   string;
  color:  string;
  value:  number;
  unit?:  string;
  label:  string;
  align?: 'left' | 'center' | 'right';
}

function CurrencySlot({ icon, color, value, unit = '', label, align = 'center' }: SlotProps) {
  const displayed = useAnimatedCounter(value);

  const textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';

  return (
    <View style={[styles.slot, { alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={[styles.value, { color }]}>
        {displayed.toLocaleString('de-DE')}
        {unit && <Text style={[styles.unit, { color }]}>{unit}</Text>}
      </Text>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CurrencyBar() {
  const { muskelmasse, protein, streakTokens } = useGameStore();

  return (
    <View style={styles.container}>
      <CurrencySlot
        icon="dumbbell"
        color={AppColors.gold}
        value={muskelmasse}
        unit="g"
        label="Muskelmasse"
        align="left"
      />
      <View style={styles.divider} />
      <CurrencySlot
        icon="diamond-stone"
        color={AppColors.teal}
        value={protein}
        label="Protein"
        align="center"
      />
      <View style={styles.divider} />
      <CurrencySlot
        icon="fire"
        color="#FF6B35"
        value={streakTokens}
        label="Streak"
        align="right"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: '#1A1A2E',
    borderRadius:    16,
    paddingVertical:   12,
    paddingHorizontal: 16,
    marginBottom:    12,
    alignItems:      'center',
  },
  slot: {
    flex:  1,
    gap:   3,
  },
  value: {
    fontSize:   18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  unit: {
    fontSize:   12,
    fontWeight: '500',
  },
  label: {
    fontSize: 10,
    color:    AppColors.textSecondary,
  },
  divider: {
    width:            1,
    height:           36,
    backgroundColor:  'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
  },
});
