// ForestParallax.tsx
// Pre-rendered 3D world map as parallax background.
// world_full.png covers all 3 biomes (desert, forest, mountains).
// world_clouds.png is a cloud overlay for locked biomes.
// The SVG grid (15x15) sits centered within the forest biome area.

import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

const WORLD_FULL = require('../../assets/terrain/world_full.png');
const WORLD_CLOUDS = require('../../assets/terrain/world_clouds.png');

interface ForestParallaxProps {
  containerWidth: number;   // full world container width (px)
  containerHeight: number;  // full world container height (px)
}

export const ForestParallax: React.FC<ForestParallaxProps> = React.memo(({
  containerWidth,
  containerHeight,
}) => {
  return (
    <>
      {/* World background — no extra transform, ScrollView moves everything together */}
      <View
        style={[styles.layer, { width: containerWidth, height: containerHeight }]}
        pointerEvents="none"
      >
        <Image
          source={WORLD_FULL}
          style={{ width: containerWidth, height: containerHeight }}
          resizeMode="cover"
        />
      </View>

      {/* Cloud overlay — fixed relative to the world */}
      <View
        style={[styles.layer, { width: containerWidth, height: containerHeight }]}
        pointerEvents="none"
      >
        <Image
          source={WORLD_CLOUDS}
          style={{ width: containerWidth, height: containerHeight }}
          resizeMode="cover"
        />
      </View>
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
