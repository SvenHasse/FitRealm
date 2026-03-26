// ForestParallax.tsx
// Pre-rendered 3D forest border as parallax background.
// The image is positioned to exactly align with the isometric grid canvas.
// Background layer scrolls slightly slower for depth perception.

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const FOREST_BG = require('../../assets/terrain/forest_bg.png');
const FOREST_FG = require('../../assets/terrain/forest_fg.png');

interface ForestParallaxProps {
  canvasWidth: number;
  canvasHeight: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}

export const ForestParallax: React.FC<ForestParallaxProps> = React.memo(({
  canvasWidth,
  canvasHeight,
  scrollX,
  scrollY,
}) => {
  // The rendered PNG matches the canvas aspect ratio (2:1 for isometric).
  // Size it to exactly fill the canvas area.
  const imgW = canvasWidth;
  const imgH = canvasHeight;

  // Background layer: shifts opposite to scroll for parallax
  // When user scrolls right, bg moves slightly left relative to fg → depth
  const bgStyle = useAnimatedStyle(() => {
    'worklet';
    const factor = 0.06; // 6% parallax offset — subtle but visible
    return {
      transform: [
        { translateX: scrollX.value * factor },
        { translateY: scrollY.value * factor },
      ],
    };
  });

  return (
    <>
      {/* Background layer — moves slightly with parallax */}
      <Animated.View
        style={[
          styles.layer,
          { width: imgW, height: imgH },
          bgStyle,
        ]}
        pointerEvents="none"
      >
        <Image
          source={FOREST_BG}
          style={{ width: imgW, height: imgH }}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Foreground layer — fixed to canvas, no transform */}
      <Animated.View
        style={[styles.layer, { width: imgW, height: imgH }]}
        pointerEvents="none"
      >
        <Image
          source={FOREST_FG}
          style={{ width: imgW, height: imgH }}
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
