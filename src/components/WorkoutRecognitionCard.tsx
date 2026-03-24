// WorkoutRecognitionCard.tsx
// Gold-glowing card that stays visible until the user taps "Auswerten →".
// Pulsing CTA button via react-native-reanimated.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';

const GOLD = AppColors.gold;

interface Props {
  workoutSummary?: string;
  onPress: () => void;
}

export default function WorkoutRecognitionCard({
  workoutSummary = '45 Min Laufen · 400 kcal · Ø 155 bpm',
  onPress,
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  const btnScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.35);

  useEffect(() => {
    btnScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1100 }),
        withTiming(0.25, { duration: 1100 }),
      ),
      -1,
      true,
    );
  }, []);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const handlePress = () => {
    setDismissed(true);
    onPress();
  };

  if (dismissed) return null;

  return (
    <View style={styles.wrapper}>
      {/* Animated glow border layer */}
      <Animated.View style={[styles.glowRing, borderStyle]} />

      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.flashWrap}>
            <Ionicons name="flash" size={22} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Neues Workout erkannt!</Text>
            <Text style={styles.summary}>{workoutSummary}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
          <Animated.View style={[styles.ctaBtn, btnStyle]}>
            <Text style={styles.ctaText}>Auswerten</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    borderRadius: 18,
  },
  glowRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: GOLD,
  },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: `${GOLD}38`,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  flashWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${GOLD}1E`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: 'bold', color: GOLD, marginBottom: 4 },
  summary: { fontSize: 13, color: AppColors.textSecondary },
  ctaBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
