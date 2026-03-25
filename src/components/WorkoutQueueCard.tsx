// WorkoutQueueCard.tsx
// Shows unprocessed workouts as a stacked card deck on Dashboard.
// 1 workout = single card, 2-3 = stacked deck, 4+ = summary with count.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';
import { Workout } from '../store/workoutStore';

const GOLD = AppColors.gold;
const CARD_HEIGHT = 140;

interface Props {
  workouts: Workout[];
  onPress: () => void;
}

export default function WorkoutQueueCard({ workouts, onPress }: Props) {
  if (workouts.length === 0) return null;

  const btnScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.35);
  const dotScale = useSharedValue(1);

  useEffect(() => {
    btnScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    );
    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1100 }),
        withTiming(0.25, { duration: 1100 }),
      ), -1, true,
    );
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1.0, { duration: 600 }),
      ), -1, true,
    );
  }, []);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const borderStyle = useAnimatedStyle(() => ({ opacity: borderOpacity.value }));
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));

  const count = workouts.length;
  const showStack = count >= 2;
  const summaryText = workouts.slice(0, 3).map((w) =>
    `${w.type} ${w.durationMinutes} Min`
  ).join(' \u00B7 ') + (count > 3 ? ` +${count - 3}` : '');

  return (
    <View style={styles.wrapper}>
      {/* Stack layers */}
      {showStack && count >= 3 && (
        <View style={[styles.stackLayer, { top: 12, left: 8, right: 8, opacity: 0.5 }]} />
      )}
      {showStack && (
        <View style={[styles.stackLayer, { top: 6, left: 4, right: 4, opacity: 0.75 }]} />
      )}

      {/* Glow ring */}
      <Animated.View style={[styles.glowRing, borderStyle]} />

      {/* Main card */}
      <View style={styles.card}>
        {/* Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Animated.View style={[styles.pulseDot, dotStyle]} />
            <Text style={styles.badgeText}>
              {count === 1 ? 'Neues Workout erkannt!' : `${count} neue Workouts`}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.headerRow}>
          <View style={styles.flashWrap}>
            <Ionicons name="flash" size={22} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {count === 1 ? workouts[0].type : `${count} Workouts warten`}
            </Text>
            <Text style={styles.summary} numberOfLines={2}>{summaryText}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          <Animated.View style={[styles.ctaBtn, btnStyle]}>
            <Text style={styles.ctaText}>
              {count === 1 ? 'Auswerten' : 'Alle auswerten'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16, borderRadius: 18, position: 'relative' },
  stackLayer: {
    position: 'absolute', height: CARD_HEIGHT, borderRadius: 16,
    backgroundColor: '#1A1A2E', borderWidth: 1,
    borderColor: `${GOLD}25`,
  },
  glowRing: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 20, borderWidth: 2, borderColor: GOLD,
  },
  card: {
    backgroundColor: AppColors.cardBackground, borderRadius: 18,
    padding: 20, gap: 14,
    borderWidth: 1, borderColor: `${GOLD}38`,
  },
  badgeRow: { flexDirection: 'row' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${GOLD}20`, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pulseDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: GOLD },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  flashWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${GOLD}1E`, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: 'bold', color: GOLD, marginBottom: 4 },
  summary: { fontSize: 13, color: AppColors.textSecondary },
  ctaBtn: {
    backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
