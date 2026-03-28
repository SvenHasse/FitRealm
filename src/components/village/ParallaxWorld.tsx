// ParallaxWorld.tsx
// Multi-layer depth parallax system for 2.5D world rendering.
// Each layer shifts at a different speed when panning → depth illusion.

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ─── Layer assets per biome ──────────────────────────────────────────────────

const BIOME_LAYERS = {
  forest: {
    bg_far:    require('../../assets/terrain/layers/forest_bg_far.png'),
    bg_mid:    require('../../assets/terrain/layers/forest_bg_mid.png'),
    grid_base: require('../../assets/terrain/layers/forest_grid_base.png'),
    fg_near:   require('../../assets/terrain/layers/forest_fg_near.png'),
  },
  desert: {
    bg_far:    require('../../assets/terrain/layers/desert_bg_far.png'),
    bg_mid:    require('../../assets/terrain/layers/desert_bg_mid.png'),
    grid_base: require('../../assets/terrain/layers/desert_grid_base.png'),
    fg_near:   require('../../assets/terrain/layers/desert_fg_near.png'),
  },
  mountains: {
    bg_far:    require('../../assets/terrain/layers/mountains_bg_far.png'),
    bg_mid:    require('../../assets/terrain/layers/mountains_bg_mid.png'),
    grid_base: require('../../assets/terrain/layers/mountains_grid_base.png'),
    fg_near:   require('../../assets/terrain/layers/mountains_fg_near.png'),
  },
} as const;

const CLOUD_LAYERS = {
  desert:    require('../../assets/terrain/layers/clouds_desert.png'),
  mountains: require('../../assets/terrain/layers/clouds_mountains.png'),
} as const;

export type BiomeKey = 'forest' | 'desert' | 'mountains';

// ─── Parallax layer component ────────────────────────────────────────────────

function ParallaxLayer({
  source, containerWidth, containerHeight, factor, zIndex, scrollX, scrollY,
}: {
  source: any;
  containerWidth: number;
  containerHeight: number;
  factor: number;
  zIndex: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: scrollX.value * factor },
        { translateY: scrollY.value * factor },
      ],
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute', top: 0, left: 0,
        width: containerWidth, height: containerHeight, zIndex,
      }, style]}
      pointerEvents="none"
    >
      <Image
        source={source}
        style={{ width: containerWidth, height: containerHeight }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

// ─── Cloud overlay with floating animation ───────────────────────────────────

function CloudLayer({
  source, containerWidth, containerHeight, scrollX, scrollY,
}: {
  source: any;
  containerWidth: number;
  containerHeight: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}) {
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 3000 }),
        withTiming(0, { duration: 3000 }),
      ), -1, false,
    );
  }, []);

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: scrollX.value * 0.02 },
        { translateY: scrollY.value * 0.02 + floatY.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute', top: 0, left: 0,
        width: containerWidth, height: containerHeight, zIndex: 6,
      }, style]}
      pointerEvents="none"
    >
      <Image
        source={source}
        style={{ width: containerWidth, height: containerHeight }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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
  const layers = BIOME_LAYERS[biome];

  return (
    <>
      {/* zIndex 1: far background — barely moves */}
      <ParallaxLayer
        source={layers.bg_far}
        containerWidth={containerWidth} containerHeight={containerHeight}
        factor={0.03} zIndex={1}
        scrollX={scrollX} scrollY={scrollY}
      />
      {/* zIndex 2: mid background — slight movement */}
      <ParallaxLayer
        source={layers.bg_mid}
        containerWidth={containerWidth} containerHeight={containerHeight}
        factor={0.08} zIndex={2}
        scrollX={scrollX} scrollY={scrollY}
      />
      {/* zIndex 3: grid base terrain — locked to grid (factor 0) */}
      <ParallaxLayer
        source={layers.grid_base}
        containerWidth={containerWidth} containerHeight={containerHeight}
        factor={0.0} zIndex={3}
        scrollX={scrollX} scrollY={scrollY}
      />
      {/* zIndex 5: foreground — moves FASTER (negative factor) = closer to camera */}
      <ParallaxLayer
        source={layers.fg_near}
        containerWidth={containerWidth} containerHeight={containerHeight}
        factor={-0.10} zIndex={5}
        scrollX={scrollX} scrollY={scrollY}
      />

      {/* zIndex 6: cloud overlays for locked biomes */}
      {showDesertClouds && (
        <CloudLayer
          source={CLOUD_LAYERS.desert}
          containerWidth={containerWidth} containerHeight={containerHeight}
          scrollX={scrollX} scrollY={scrollY}
        />
      )}
      {showMountainClouds && (
        <CloudLayer
          source={CLOUD_LAYERS.mountains}
          containerWidth={containerWidth} containerHeight={containerHeight}
          scrollX={scrollX} scrollY={scrollY}
        />
      )}
    </>
  );
});
