// TotalRewardSummary.tsx
// Big "total earned" block that scales in with a golden glow after all rows complete.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';
import { formatGrams } from '../utils/currencyCalculator';

interface Props {
  totalMuskelmasse: number;
  protein: number;
  streakToken: number;
  visible: boolean;
}

export default function TotalRewardSummary({
  totalMuskelmasse,
  protein,
  streakToken,
  visible,
}: Props) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 160 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.glow} />
      <Text style={styles.totalLine}>
        {formatGrams(totalMuskelmasse)} Muskelmasse
        {protein > 0 ? ` + ${protein} Protein` : ''}
      </Text>
      {streakToken > 0 && (
        <Text style={styles.streakLine}>Streak Token +{streakToken} 🔥</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderWidth: 1,
    borderColor: `${AppColors.gold}40`,
  },
  glow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    // Simulated glow via shadow
    shadowColor: AppColors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  totalLine: {
    fontSize: 26,
    fontWeight: 'bold',
    color: AppColors.gold,
    textAlign: 'center',
    lineHeight: 34,
  },
  streakLine: {
    marginTop: 8,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
});
