// VirtualJoystick.tsx — Gesture-based joystick overlay for bottom half of screen

import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated';
import { JOYSTICK_RADIUS, JOYSTICK_KNOB_RADIUS, JOYSTICK_DEAD_ZONE } from '../constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  onJoystickMove: (dx: number, dy: number) => void;
}

export default function VirtualJoystick({ onJoystickMove }: Props) {
  const baseX = useSharedValue(0);
  const baseY = useSharedValue(0);
  const knobX = useSharedValue(0);
  const knobY = useSharedValue(0);
  const visible = useSharedValue(0);

  const reportMove = useCallback((dx: number, dy: number) => {
    onJoystickMove(dx, dy);
  }, [onJoystickMove]);

  const gesture = Gesture.Pan()
    .onStart((e) => {
      baseX.value = e.x;
      baseY.value = e.y;
      knobX.value = e.x;
      knobY.value = e.y;
      visible.value = withTiming(1, { duration: 80 });
    })
    .onUpdate((e) => {
      const dx = e.x - baseX.value;
      const dy = e.y - baseY.value;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < JOYSTICK_DEAD_ZONE) {
        knobX.value = baseX.value;
        knobY.value = baseY.value;
        runOnJS(reportMove)(0, 0);
        return;
      }

      // Clamp knob within radius
      const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
      const angle = Math.atan2(dy, dx);
      knobX.value = baseX.value + Math.cos(angle) * clampedDist;
      knobY.value = baseY.value + Math.sin(angle) * clampedDist;

      // Normalized output (-1 to 1)
      const strength = Math.min(dist / JOYSTICK_RADIUS, 1);
      const normDx = Math.cos(angle) * strength;
      const normDy = Math.sin(angle) * strength;
      runOnJS(reportMove)(normDx, normDy);
    })
    .onEnd(() => {
      visible.value = withTiming(0, { duration: 100 });
      knobX.value = baseX.value;
      knobY.value = baseY.value;
      runOnJS(reportMove)(0, 0);
    });

  const baseStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: baseX.value - JOYSTICK_RADIUS,
    top: baseY.value - JOYSTICK_RADIUS,
    width: JOYSTICK_RADIUS * 2,
    height: JOYSTICK_RADIUS * 2,
    borderRadius: JOYSTICK_RADIUS,
    borderWidth: 2,
    borderColor: `rgba(255,255,255,${0.3 * visible.value})`,
    backgroundColor: `rgba(255,255,255,${0.1 * visible.value})`,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: knobX.value - JOYSTICK_KNOB_RADIUS,
    top: knobY.value - JOYSTICK_KNOB_RADIUS,
    width: JOYSTICK_KNOB_RADIUS * 2,
    height: JOYSTICK_KNOB_RADIUS * 2,
    borderRadius: JOYSTICK_KNOB_RADIUS,
    backgroundColor: `rgba(255,255,255,${0.5 * visible.value})`,
  }));

  return (
    <View style={styles.touchArea} pointerEvents="box-only">
      <GestureDetector gesture={gesture}>
        <View style={styles.gestureArea}>
          <Animated.View style={baseStyle} />
          <Animated.View style={knobStyle} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
  },
  gestureArea: {
    flex: 1,
  },
});
