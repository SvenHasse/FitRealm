// ParallaxWorld.tsx
// 2.5D parallax: world_full.png as base + fg_near overlay that shifts faster.
// The foreground trees move quicker than the background when panning = depth.

import React from 'react';
import { Image } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// Base world image (all 3 biomes combined)
const WORLD_FULL = require('../../assets/terrain/world_full.png');

// Foreground tree overlays per biome (move faster = parallax depth)
const FG_LAYERS = {
  forest:    require('../../assets/terrain/layers/forest_fg_near.png'),
  desert:    require('../../assets/terrain/layers/desert_fg_near.png'),
  mountains: require('../../assets/terrain/layers/mountains_fg_near.png'),
} as const;

// Cloud overlays for locked biomes
const CLOUD_LAYERS = {
  desert:    require('../../assets/terrain/layers/clouds_desert.png'),
  mountains: require('../../assets/terrain/layers/clouds_mountains.png'),
} as const;

export type BiomeKey = 'forest' | 'desert' | 'mountains';

interface ParallaxWorldProps {
  biome: BiomeKey;
  containerWidth: number;
  containerHeight: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
  showDesertClouds?: boolean;
  showMountainClouds?: boolean;
}

export const ParallaxWorld: React.FC<ParallaxWorldProps> = React.memo(({
  biome,
  containerWidth,
  containerHeight,
  scrollX,
  scrollY,
  showDesertClouds = true,
  showMountainClouds = true,
}) => {
  // Background: slight parallax (moves slower than grid)
  const bgStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: scrollX.value * 0.04 },
        { translateY: scrollY.value * 0.04 },
      ],
    };
  });

  // Foreground: negative parallax (moves faster than grid = closer to camera)
  const fgStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: scrollX.value * -0.08 },
        { translateY: scrollY.value * -0.08 },
      ],
    };
  });

  // Cloud floating animation
  const floatY = useSharedValue(0);
  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 3000 }),
        withTiming(0, { duration: 3000 }),
      ), -1, false,
    );
  }, []);

  const cloudStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: scrollX.value * 0.02 },
        { translateY: scrollY.value * 0.02 + floatY.value },
      ],
    };
  });

  const imgStyle = { width: containerWidth, height: containerHeight };

  return (
    <>
      {/* Layer 1: Full world background — slight parallax behind grid */}
      <Animated.View
        style={[{
          position: 'absolute', top: 0, left: 0,
          width: containerWidth, height: containerHeight,
          zIndex: -1,
        }, bgStyle]}
        pointerEvents="none"
      >
        <Image source={WORLD_FULL} style={imgStyle} resizeMode="cover" />
      </Animated.View>

      {/* Layer 2: Foreground trees — OVER the grid, faster parallax */}
      <Animated.View
        style={[{
          position: 'absolute', top: 0, left: 0,
          width: containerWidth, height: containerHeight,
          zIndex: 10,
        }, fgStyle]}
        pointerEvents="none"
      >
        <Image source={FG_LAYERS[biome]} style={imgStyle} resizeMode="cover" />
      </Animated.View>

      {/* Layer 3: Cloud overlays for locked biomes */}
      {showDesertClouds && (
        <Animated.View
          style={[{
            position: 'absolute', top: 0, left: 0,
            width: containerWidth, height: containerHeight,
            zIndex: 11,
          }, cloudStyle]}
          pointerEvents="none"
        >
          <Image source={CLOUD_LAYERS.desert} style={imgStyle} resizeMode="cover" />
        </Animated.View>
      )}
      {showMountainClouds && (
        <Animated.View
          style={[{
            position: 'absolute', top: 0, left: 0,
            width: containerWidth, height: containerHeight,
            zIndex: 11,
          }, cloudStyle]}
          pointerEvents="none"
        >
          <Image source={CLOUD_LAYERS.mountains} style={imgStyle} resizeMode="cover" />
        </Animated.View>
      )}
    </>
  );
});
