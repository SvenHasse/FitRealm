// ForestParallax.tsx
// Pre-rendered 3D world map as parallax background.
// world_full.png covers all 3 biomes (desert, forest, mountains).
// world_clouds.png is a cloud overlay for locked biomes.
// The SVG grid (15x15) sits centered within the forest biome area.

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const WORLD_FULL = require('../../assets/terrain/world_full.png');
const WORLD_CLOUDS = require('../../assets/terrain/world_clouds.png');

interface ForestParallaxProps {
  containerWidth: number;   // full world container width (px)
  containerHeight: number;  // full world container height (px)
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}

export const ForestParallax: React.FC<ForestParallaxProps> = React.memo(({
  containerWidth,
  containerHeight,
  scrollX,
  scrollY,
}) => {
  // Background layer — slight parallax (moves slower than the grid)
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
      {/* World background — parallax */}
      <Animated.View
        style={[styles.layer, { width: containerWidth, height: containerHeight }, bgStyle]}
        pointerEvents="none"
      >
        <Image
          source={WORLD_FULL}
          style={{ width: containerWidth, height: containerHeight }}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Cloud overlay — fixed relative to the world (no parallax) */}
      <Animated.View
        style={[styles.layer, { width: containerWidth, height: containerHeight }]}
        pointerEvents="none"
      >
        <Image
          source={WORLD_CLOUDS}
          style={{ width: containerWidth, height: containerHeight }}
          resizeMode="cover"
        />
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
