import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface CloudPos {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  driftX: number;
  driftY: number;
  driftDuration: number;
}

function generateClouds(area: 'top-left' | 'bottom-right'): CloudPos[] {
  const baseX = area === 'top-left' ? -40 : SCREEN_W * 0.35;
  const baseY = area === 'top-left' ? -20 : SCREEN_H * 0.45;
  const clouds: CloudPos[] = [];

  // Create 5-6 overlapping cloud shapes to form a foggy cover
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    clouds.push({
      x: baseX + col * 100 + (Math.random() * 40 - 20),
      y: baseY + row * 80 + (Math.random() * 30 - 15),
      w: 180 + Math.random() * 60,
      h: 100 + Math.random() * 40,
      scale: 0.9 + Math.random() * 0.3,
      driftX: 8 + Math.random() * 12,
      driftY: 4 + Math.random() * 6,
      driftDuration: 4000 + Math.random() * 3000,
    });
  }
  return clouds;
}

interface CloudOverlayProps {
  area: 'top-left' | 'bottom-right';
  visible: boolean; // false triggers fade-out (unlock)
  onFadeComplete?: () => void;
}

export default function CloudOverlay({ area, visible, onFadeComplete }: CloudOverlayProps) {
  const clouds = useRef(generateClouds(area)).current;
  const driftAnims = useRef(clouds.map(() => new Animated.Value(0))).current;
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // Drift animation
  useEffect(() => {
    const animations = driftAnims.map((anim) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [driftAnims]);

  // Fade in/out
  useEffect(() => {
    if (!visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        onFadeComplete?.();
      });
    } else {
      fadeAnim.setValue(1);
    }
  }, [visible, fadeAnim, onFadeComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="none">
      {clouds.map((cloud, i) => {
        const translateX = driftAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, cloud.driftX],
        });
        const translateY = driftAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, cloud.driftY],
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: cloud.x,
              top: cloud.y,
              width: cloud.w,
              height: cloud.h,
              backgroundColor: 'rgba(200, 210, 220, 0.85)',
              borderRadius: 60,
              transform: [
                { scale: cloud.scale },
                { translateX },
                { translateY },
              ],
            }}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
