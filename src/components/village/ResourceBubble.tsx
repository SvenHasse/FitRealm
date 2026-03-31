// ResourceBubble.tsx
// Floating collection bubble that appears over a producing building when its
// currentStorage reaches ≥5 % of maxStorage.
//
// Lifecycle:
//  • visible=true  → fade/scale in, then idle float loop
//  • tap           → bounce → fly-up → opacity=0 → onCollect() via runOnJS
//                    (store update happens after animation so the component
//                     stays mounted for the full fly-away)
//  • visible=false → cancel float, fade out  (e.g. "collect all" pressed)

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withDelay,
  Easing, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ResourceType, getResourceIcon, getResourceColor } from '../../utils/buildingResources';

interface Props {
  resourceType: ResourceType;
  /** currentStorage value to display */
  amount: number;
  /** Container-relative centre X (the bubble is centred on this point) */
  x: number;
  /** Container-relative top Y of the bubble */
  y: number;
  onCollect: () => void;
  visible: boolean;
}

// Width of a typical bubble — used to centre it on `x`.
const BUBBLE_HALF_W = 30;

export function ResourceBubble({ resourceType, amount, x, y, onCollect, visible }: Props) {
  const isCollecting = useRef(false);

  // ── Idle state ──────────────────────────────────────────────────────────────
  const floatY  = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.6);

  // ── Collect (fly-away) state ─────────────────────────────────────────────--
  const flyY       = useSharedValue(0);
  const flyScale   = useSharedValue(1);
  const flyOpacity = useSharedValue(1);

  // ── React to visibility changes ─────────────────────────────────────────────
  useEffect(() => {
    if (visible && !isCollecting.current) {
      // Reset collect-animation values in case a re-mount occurs
      flyY.value       = 0;
      flyScale.value   = 1;
      flyOpacity.value = 1;

      // Appear
      opacity.value = withTiming(1, { duration: 300 });
      scale.value   = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.back(1.5)),
      });

      // Idle float
      floatY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(5,  { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // infinite
        true,
      );
    } else if (!visible) {
      // External dismiss (e.g. "collect all" tapped) — just fade out
      cancelAnimation(floatY);
      floatY.value  = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value   = withTiming(0.6, { duration: 200 });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tap handler ─────────────────────────────────────────────────────────────
  const handlePress = () => {
    if (isCollecting.current) return;
    isCollecting.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Stop the idle float
    cancelAnimation(floatY);

    // 1. Bounce scale up then shrink to nothing while flying upward
    flyScale.value = withSequence(
      withTiming(1.4, { duration: 90 }),
      withTiming(0.1, { duration: 480, easing: Easing.in(Easing.cubic) }),
    );
    flyY.value = withTiming(-290, {
      duration: 570,
      easing: Easing.in(Easing.quad),
    });

    // 2. Fade out during the flight, call onCollect when done
    flyOpacity.value = withDelay(
      180,
      withTiming(0, { duration: 380 }, (finished) => {
        if (finished) runOnJS(onCollect)();
      }),
    );
  };

  // ── Animated styles ─────────────────────────────────────────────────────────
  const containerStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value * flyOpacity.value,
    transform: [
      { translateY: floatY.value + flyY.value },
      { scale:      scale.value * flyScale.value },
    ],
  }));

  // ── Render ───────────────────────────────────────────────────────────────────
  const icon  = getResourceIcon(resourceType);
  const color = getResourceColor(resourceType);
  const displayAmount = amount < 1
    ? `+${amount.toFixed(1)}`
    : `+${Math.floor(amount)}`;

  return (
    <Animated.View
      style={[
        styles.container,
        { left: x - BUBBLE_HALF_W, top: y },
        containerStyle,
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={[styles.bubble, { borderColor: color }]}
      >
        <MaterialCommunityIcons name={icon as any} size={15} color={color} />
        <Text style={[styles.amount, { color }]}>{displayAmount}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9100,
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: 'rgba(12, 12, 28, 0.90)',
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // "floating" shadow
    shadowColor: '#000',
    shadowOpacity: 0.50,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
