// ForestParallax.tsx
// Pre-rendered 3D forest border as parallax background layers.
// Two layers at different scroll speeds create depth perception.

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const FOREST_BG = require('../../assets/terrain/forest_bg.png');
const FOREST_FG = require('../../assets/terrain/forest_fg.png');

interface ForestParallaxProps {
  /** Total canvas width (the SVG grid area) */
  canvasWidth: number;
  /** Total canvas height */
  canvasHeight: number;
  /** Current scroll X offset (shared value for smooth animation) */
  scrollX: SharedValue<number>;
  /** Current scroll Y offset (shared value for smooth animation) */
  scrollY: SharedValue<number>;
  /** Screen dimensions */
  screenWidth: number;
  screenHeight: number;
}

/**
 * Renders two pre-rendered forest PNG layers behind the SVG grid.
 * - Background layer (bg) scrolls at 0.85x speed → parallax depth
 * - Foreground layer (fg) scrolls at 1.0x speed → matches grid
 *
 * Both are centered on the grid center and sized to cover the full forest area.
 */
export const ForestParallax: React.FC<ForestParallaxProps> = React.memo(({
  canvasWidth,
  canvasHeight,
  scrollX,
  scrollY,
  screenWidth,
  screenHeight,
}) => {
  // The forest images are square — size them to cover the canvas
  const imgSize = Math.max(canvasWidth, canvasHeight) * 1.15; // slightly larger for parallax room

  // Background layer: scrolls slower (0.85x) for depth effect
  const bgStyle = useAnimatedStyle(() => {
    'worklet';
    const parallaxFactor = 0.15; // how much slower bg moves (0 = fixed, 1 = same as scroll)
    const offsetX = scrollX.value * parallaxFactor;
    const offsetY = scrollY.value * parallaxFactor;
    return {
      transform: [
        { translateX: -offsetX },
        { translateY: -offsetY },
      ],
    };
  });

  // Both layers are absolutely positioned behind the SVG content
  // Centered on the canvas
  const centerX = (canvasWidth - imgSize) / 2;
  const centerY = (canvasHeight - imgSize) / 2;

  return (
    <>
      {/* Background layer — moves slower for parallax */}
      <Animated.View
        style={[
          styles.layer,
          {
            left: centerX,
            top: centerY,
            width: imgSize,
            height: imgSize,
          },
          bgStyle,
        ]}
        pointerEvents="none"
      >
        <Image
          source={FOREST_BG}
          style={{ width: imgSize, height: imgSize }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Foreground layer — scrolls with the grid (no transform needed, it's in the scroll container) */}
      <View
        style={[
          styles.layer,
          {
            left: centerX,
            top: centerY,
            width: imgSize,
            height: imgSize,
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={FOREST_FG}
          style={{ width: imgSize, height: imgSize }}
          resizeMode="contain"
        />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    zIndex: -1,
  },
});
