// ForestBorderSprites.tsx
// Renders 996 individual tree/rock/bush sprites extracted from the Blender GLB.
// Each sprite has a depth-based parallaxFactor so that background trees move
// slower than foreground trees when the camera pans → real parallax effect.
//
// The sprites are absolutely positioned within the same scrollable container
// as the SVG grid. parallaxFactor offsets are applied via Reanimated worklets
// on the UI thread for 60fps performance.

import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import borderSpritesRaw from '../../assets/village/border_sprites.json';
import { SPRITE_REQUIRES } from '../../assets/village/spriteRequires';

interface SpriteEntry {
  id: string;
  sprite: string;
  screenX: number;  // normalized [-1..1]
  screenY: number;  // normalized [-1..1]
  depth: number;
  parallaxFactor: number;  // 0.5 (far) → 1.0 (near)
  scale: number;
}

// Tuning constants
const BASE_SPRITE_SIZE = 90;        // Base pixel size for scale=1.0 sprite
const PARALLAX_STRENGTH = 0.15;     // How strong the parallax shift is

interface ForestBorderSpritesProps {
  containerWidth: number;   // Total container width (the 25/15 scaled canvas)
  containerHeight: number;  // Total container height
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}

// Memoized single sprite with parallax animation
const BorderSprite = React.memo(({
  entry,
  baseX,
  baseY,
  size,
  scrollX,
  scrollY,
}: {
  entry: SpriteEntry;
  baseX: number;
  baseY: number;
  size: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
}) => {
  const source = SPRITE_REQUIRES[entry.sprite];
  if (!source) return null;

  const pf = entry.parallaxFactor;

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    // Grid moves 1:1 with scroll. Each sprite moves at parallaxFactor speed.
    // The offset = scroll * (parallaxFactor - 1) * strength creates the shift.
    const offsetX = scrollX.value * (pf - 1) * PARALLAX_STRENGTH;
    const offsetY = scrollY.value * (pf - 1) * PARALLAX_STRENGTH * 0.5;
    return {
      transform: [
        { translateX: offsetX },
        { translateY: offsetY },
      ],
    };
  });

  return (
    <Animated.Image
      source={source}
      style={[
        {
          position: 'absolute',
          left: baseX - size * 0.5,
          top: baseY - size * 0.85,  // anchor near bottom (tree trunk base)
          width: size,
          height: size,
          zIndex: Math.round(baseY),
        },
        animStyle,
      ]}
      resizeMode="contain"
    />
  );
});

export const ForestBorderSprites: React.FC<ForestBorderSpritesProps> = React.memo(({
  containerWidth,
  containerHeight,
  scrollX,
  scrollY,
}) => {
  // Pre-compute pixel positions from normalized coordinates
  const spriteData = useMemo(() => {
    const entries = borderSpritesRaw as SpriteEntry[];
    return entries.map(entry => ({
      entry,
      baseX: (entry.screenX + 1) * 0.5 * containerWidth,
      baseY: (entry.screenY + 1) * 0.5 * containerHeight,
      size: BASE_SPRITE_SIZE * entry.scale,
    }));
  }, [containerWidth, containerHeight]);

  return (
    <View
      style={[styles.container, { width: containerWidth, height: containerHeight }]}
      pointerEvents="none"
    >
      {spriteData.map(({ entry, baseX, baseY, size }) => (
        <BorderSprite
          key={entry.id}
          entry={entry}
          baseX={baseX}
          baseY={baseY}
          size={size}
          scrollX={scrollX}
          scrollY={scrollY}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
