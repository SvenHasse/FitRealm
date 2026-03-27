// ForestParallax.tsx
// Pre-rendered 3D forest as parallax background.
// The forest PNG covers the full 25x25 area (grid + border).
// The SVG grid (15x15) sits centered within this larger image.
// The container is sized to the forest image, not the grid.

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const FOREST_BG = require('../../assets/terrain/forest_bg.png');
const FOREST_FG = require('../../assets/terrain/forest_fg.png');

interface ForestParallaxProps {
  canvasWidth: number;   // SVG grid width (15 tiles)
  canvasHeight: number;  // SVG grid height (15 tiles)
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}

// Forest was rendered for 25x25 tiles, grid is 15x15
const SCALE = 25 / 15;

export const ForestParallax: React.FC<ForestParallaxProps> = React.memo(({
  canvasWidth,
  canvasHeight,
  scrollX,
  scrollY,
}) => {
  // Container matches the parent (25/15 * canvas). Image must COVER it fully.
  const containerW = Math.round(canvasWidth * SCALE);
  const containerH = Math.round(canvasHeight * SCALE);

  const bgStyle = useAnimatedStyle(() => {
    'worklet';
    const factor = 0.06;
    return {
      transform: [
        { translateX: scrollX.value * factor },
        { translateY: scrollY.value * factor },
      ],
    };
  });

  return (
    <>
      <Animated.View
        style={[styles.layer, { width: containerW, height: containerH }, bgStyle]}
        pointerEvents="none"
      >
        <Image source={FOREST_BG} style={{ width: containerW, height: containerH }} resizeMode="cover" />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { width: containerW, height: containerH }]}
        pointerEvents="none"
      >
        <Image source={FOREST_FG} style={{ width: containerW, height: containerH }} resizeMode="cover" />
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
});
