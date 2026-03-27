// TutorialOverlay.tsx — Animated tutorial arrow + text (React Native Views, NOT SVG)

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  step: number; // 0 = off, 1-12 = active
  targetPosition: { screenX: number; screenY: number } | null;
}

const TUTORIAL_TEXTS: Record<number, string> = {
  1: 'Geh zu den Wildschweinen!',
  2: 'Greife ein Wildschwein an!',
  3: 'Sammle das Fleisch ein!',
  4: 'Bring das Fleisch zur R\u00e4ucherkammer!',
  5: 'Warte auf das ger\u00e4ucherte Fleisch...',
  6: 'Hole das ger\u00e4ucherte Fleisch!',
  7: 'Bring es zur Wickelstation!',
  8: 'Hole den fertigen Proviant!',
  9: 'Verkaufe am Handelsposten!',
  10: 'Sammle die M\u00fcnzen ein!',
  11: 'Kaufe eine Verbesserung!',
  12: 'Du bist ein Meisterj\u00e4ger!',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function TutorialOverlay({ step, targetPosition }: Props) {
  if (step <= 0 || step > 12) return null;

  // Pulse animation
  const pulse = useSharedValue(0.9);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const text = TUTORIAL_TEXTS[step] ?? '';

  // Calculate arrow rotation toward target
  let arrowRotDeg = -90; // default: point up
  let arrowX = SCREEN_W / 2 - 16;
  let arrowY = SCREEN_H / 2 - 80;

  if (targetPosition) {
    const centerX = SCREEN_W / 2;
    const centerY = SCREEN_H / 2;
    const dx = targetPosition.screenX - centerX;
    const dy = targetPosition.screenY - centerY;
    arrowRotDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    // Position arrow between center and target
    const dist = Math.sqrt(dx * dx + dy * dy);
    const arrowDist = Math.min(dist * 0.4, 80);
    arrowX = centerX + (dx / (dist || 1)) * arrowDist - 16;
    arrowY = centerY + (dy / (dist || 1)) * arrowDist - 16;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Arrow pointing at target */}
      {step < 12 && (
        <Animated.View
          style={[
            styles.arrowWrap,
            pulseStyle,
            {
              left: arrowX,
              top: arrowY,
              transform: [{ rotate: `${arrowRotDeg}deg` }],
            },
          ]}
        >
          <View style={styles.arrowTriangle} />
        </Animated.View>
      )}

      {/* Text box */}
      <Animated.View style={[styles.textBox, pulseStyle]}>
        <Text style={styles.tutorialText}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  arrowWrap: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    borderLeftWidth: 18,
    borderLeftColor: '#ffffff',
  },
  textBox: {
    position: 'absolute',
    bottom: 160,
    left: 40,
    right: 40,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  tutorialText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
