// CurrencyBar.tsx
// Polished game-like currency display: Muskelmasse + Protein.
// Gradient background, icon glow, pulse animation on value change.

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { AppColors } from '../models/types';

// ─── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, durationMs = 800): number {
  const [displayed, setDisplayed] = useState(target);
  const prevRef  = useRef(target);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const STEPS    = 40;
    const interval = durationMs / STEPS;
    let count      = 0;

    timerRef.current = setInterval(() => {
      count++;
      const t = count / STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (target - from) * eased));
      if (count >= STEPS) {
        clearInterval(timerRef.current!);
        setDisplayed(target);
      }
    }, interval);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [target, durationMs]);

  return displayed;
}

// ─── Single currency slot with glow + pulse ──────────────────────────────────

interface SlotProps {
  icon:  string;
  color: string;
  value: number;
  unit?: string;
  label: string;
}

function CurrencySlot({ icon, color, value, unit = '', label }: SlotProps) {
  const displayed = useAnimatedCounter(value);
  const scale = useSharedValue(1);
  const prevVal = useRef(value);

  useEffect(() => {
    if (prevVal.current !== value) {
      prevVal.current = value;
      scale.value = withSequence(
        withTiming(1.15, { duration: 150 }),
        withTiming(1.0,  { duration: 250 }),
      );
    }
  }, [value]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.slot}>
      {/* Icon with glow */}
      <View style={styles.iconWrap}>
        <View style={[styles.glow, { backgroundColor: color }]} />
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      {/* Value with pulse */}
      <Animated.View style={pulseStyle}>
        <Text style={styles.value}>
          {displayed.toLocaleString('de-DE')}
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </Text>
      </Animated.View>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CurrencyBar() {
  const { muskelmasse, protein } = useGameStore();

  return (
    <LinearGradient
      colors={['#1E1E3A', '#252547']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <CurrencySlot
        icon="dumbbell"
        color="#F5A623"
        value={muskelmasse}
        unit="g"
        label="MUSKELMASSE"
      />
      <View style={styles.divider} />
      <CurrencySlot
        icon="diamond-stone"
        color="#00BCD4"
        value={protein}
        label="PROTEIN"
      />
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    borderRadius:      20,
    paddingVertical:   14,
    paddingHorizontal: 16,
    marginBottom:      12,
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       'rgba(245,166,35,0.2)',
  },
  slot: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  iconWrap: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  glow: {
    position:     'absolute',
    width:        34,
    height:       34,
    borderRadius: 17,
    opacity:      0.15,
  },
  value: {
    fontSize:   20,
    fontWeight: 'bold',
    color:      '#FFFFFF',
    lineHeight: 24,
  },
  unit: {
    fontSize:   13,
    fontWeight: '500',
  },
  label: {
    fontSize:       10,
    color:          'rgba(255,255,255,0.6)',
    textTransform:  'uppercase',
    letterSpacing:  0.5,
  },
  divider: {
    width:           1,
    height:          44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
  },
});
