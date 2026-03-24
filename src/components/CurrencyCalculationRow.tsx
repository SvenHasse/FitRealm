// CurrencyCalculationRow.tsx
// A reward calculation row: fades in then counts up the result value.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';

interface Props {
  emoji: string;
  title: string;
  formula: string;
  finalValue: number;       // raw number to count up to
  unit: string;             // e.g. "g" or " Protein"
  valueColor?: string;
  delayMs?: number;
  countDuration?: number;
}

function useCountUp(target: number, durationMs: number, startAfterMs: number): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const startTimer = setTimeout(() => {
      const steps = 40;
      const interval = durationMs / steps;
      let step = 0;
      const id = setInterval(() => {
        step++;
        setVal(parseFloat((target * Math.min(step / steps, 1)).toFixed(1)));
        if (step >= steps) clearInterval(id);
      }, interval);
      return () => clearInterval(id);
    }, startAfterMs);
    return () => clearTimeout(startTimer);
  }, [target, durationMs, startAfterMs]);
  return val;
}

export default function CurrencyCalculationRow({
  emoji,
  title,
  formula,
  finalValue,
  unit,
  valueColor = AppColors.gold,
  delayMs = 0,
  countDuration = 600,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(
      delayMs,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Count starts after the row has faded in
  const displayed = useCountUp(finalValue, countDuration, delayMs + 200);
  const displayStr =
    finalValue % 1 === 0
      ? `${Math.floor(displayed)}`
      : displayed.toFixed(1).replace('.', ',');

  return (
    <Animated.View style={[styles.wrapper, rowStyle]}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.formula}>{formula}</Text>
      </View>
      <Text style={[styles.result, { color: valueColor }]}>
        +{displayStr}{unit}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  left: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 18 },
  title: { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  formula: { fontSize: 12, color: AppColors.textSecondary, marginLeft: 26 },
  result: { fontSize: 20, fontWeight: 'bold', minWidth: 72, textAlign: 'right' },
});
