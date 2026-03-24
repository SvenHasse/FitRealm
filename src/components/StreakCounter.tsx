// StreakCounter.tsx
// Large animated streak number + progress bar towards the next 7-day milestone.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';

const STREAK_COLOR = '#FF6B35';

interface Props {
  streak: number;
  milestone: number; // next target day count (e.g. 7, 14, 21 …)
}

export default function StreakCounter({ streak, milestone }: Props) {
  const scale = useSharedValue(1);
  const progress = milestone > 0 ? Math.min(streak / milestone, 1) : 0;
  const daysLeft = Math.max(milestone - streak, 0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 200 }),
      withSpring(1.0, { damping: 8, stiffness: 160 }),
    );
  }, [streak]);

  const flameAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Animated.View style={flameAnim}>
          <Ionicons name="flame" size={42} color={STREAK_COLOR} />
        </Animated.View>
        <View style={styles.info}>
          <View style={styles.numberRow}>
            <Text style={styles.number}>{streak}</Text>
            <Text style={styles.numberSuffix}> Tage</Text>
          </View>
          <Text style={styles.sub}>Workout-Streak</Text>
        </View>
      </View>

      {/* Progress towards next milestone */}
      <View style={styles.progressWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.hint}>
          {daysLeft > 0
            ? `Noch ${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''} bis 💪 Dranbleiber (+100g Muskelmasse)`
            : '🎉 Meilenstein erreicht!'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${STREAK_COLOR}30`,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  info: { flex: 1 },
  numberRow: { flexDirection: 'row', alignItems: 'baseline' },
  number: { fontSize: 52, fontWeight: 'bold', color: STREAK_COLOR },
  numberSuffix: { fontSize: 20, color: AppColors.textSecondary },
  sub: { fontSize: 13, color: AppColors.textSecondary, marginTop: 2 },
  progressWrap: { gap: 8 },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: STREAK_COLOR,
    borderRadius: 4,
  },
  hint: { fontSize: 12, color: AppColors.textSecondary, lineHeight: 18 },
});
