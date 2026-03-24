// WorkoutSummaryRow.tsx
// A single stat row (icon + label + value) that slides in from the left.

import React, { useEffect } from 'react';
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
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  delayMs?: number;
}

export default function WorkoutSummaryRow({
  icon,
  label,
  value,
  valueColor = AppColors.textPrimary,
  delayMs = 0,
}: Props) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-24);

  useEffect(() => {
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 320 }));
    translateX.value = withDelay(
      delayMs,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.row, style]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconWrap: { width: 24, alignItems: 'center' },
  label: { flex: 1, fontSize: 15, color: AppColors.textSecondary },
  value: { fontSize: 16, fontWeight: '700' },
});
