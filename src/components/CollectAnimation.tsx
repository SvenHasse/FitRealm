// CollectAnimation.tsx
// Overlay shown after tapping "Einsammeln":
//   1. Muskelmasse label flies upward + fades out
//   2. 30 confetti particles burst from center
// Parent controls visibility via the `collecting` boolean.

import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';
import GameIcon from './GameIcon';
import { formatGrams } from '../utils/currencyCalculator';

const { width: SW, height: SH } = Dimensions.get('window');
const PARTICLE_COUNT = 30;
const COLORS = ['#F5A623', '#00BCD4', '#FF6B35', '#4CAF50', '#E91E63', '#9C27B0'];

interface Particle {
  id: number;
  color: string;
  dx: number; // final x offset
  dy: number; // final y offset (negative = up)
  size: number;
  delay: number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

interface Props {
  collecting: boolean;
  totalMuskelmasse: number;
}

export default function CollectAnimation({ collecting, totalMuskelmasse }: Props) {
  const labelY = useSharedValue(0);
  const labelOpacity = useSharedValue(0);

  useEffect(() => {
    if (collecting) {
      labelOpacity.value = withTiming(1, { duration: 100 });
      labelY.value = withTiming(-220, { duration: 800, easing: Easing.out(Easing.cubic) });
      labelOpacity.value = withDelay(200, withTiming(0, { duration: 600 }));
    }
  }, [collecting]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  // Generate stable particles (only once)
  const particles: Particle[] = useMemo(() => (
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dx: randomBetween(-SW / 2, SW / 2),
      dy: randomBetween(-SH * 0.6, -SH * 0.1),
      size: randomBetween(6, 14),
      delay: randomBetween(0, 200),
    }))
  ), []);

  if (!collecting) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Fly-up label */}
      <Animated.View style={[styles.labelWrap, labelStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.label}>+{formatGrams(totalMuskelmasse)}</Text>
          <GameIcon name="mm" size={13} color={AppColors.gold} />
        </View>
      </Animated.View>

      {/* Confetti burst */}
      {particles.map(p => (
        <ConfettiParticle key={p.id} particle={p} active={collecting} />
      ))}
    </View>
  );
}

function ConfettiParticle({ particle, active }: { particle: Particle; active: boolean }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const dur = 1200;
      x.value = withDelay(particle.delay, withTiming(particle.dx, { duration: dur, easing: Easing.out(Easing.cubic) }));
      y.value = withDelay(particle.delay, withTiming(particle.dy, { duration: dur, easing: Easing.out(Easing.cubic) }));
      rotate.value = withDelay(particle.delay, withTiming(720, { duration: dur }));
      opacity.value = withDelay(particle.delay + dur * 0.5, withTiming(0, { duration: dur * 0.5 }));
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 4,
          // Start from vertical center, horizontal center
          left: SW / 2 - particle.size / 2,
          top: SH / 2,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '40%',
    alignItems: 'center',
    zIndex: 10,
  },
  label: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.gold,
    textShadowColor: AppColors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  particle: {
    position: 'absolute',
  },
});
