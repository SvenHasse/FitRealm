// DirectionArrow.tsx — Screen-edge direction arrows (React Native Views, NOT SVG)

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  targetX: number;
  targetY: number;
  playerX: number;
  playerY: number;
  color: string;
  visible: boolean;
  screenWidth: number;
  screenHeight: number;
  tick: number;
}

export default function DirectionArrow({
  targetX, targetY, playerX, playerY,
  color, visible, screenWidth, screenHeight, tick,
}: Props) {
  if (!visible) return null;

  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const angle = Math.atan2(dy, dx);

  // Position at screen edge
  const margin = 30;
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;

  // Cast a ray from center to the edge
  let edgeX = centerX;
  let edgeY = centerY;

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // Find intersection with screen edges
  const maxX = screenWidth - margin;
  const maxY = screenHeight - margin;
  const minX = margin;
  const minY = margin;

  // Scale factor to reach edge
  let t = Infinity;
  if (cosA > 0) t = Math.min(t, (maxX - centerX) / cosA);
  if (cosA < 0) t = Math.min(t, (minX - centerX) / cosA);
  if (sinA > 0) t = Math.min(t, (maxY - centerY) / sinA);
  if (sinA < 0) t = Math.min(t, (minY - centerY) / sinA);

  edgeX = centerX + cosA * t;
  edgeY = centerY + sinA * t;

  // Clamp
  edgeX = Math.max(minX, Math.min(maxX, edgeX));
  edgeY = Math.max(minY, Math.min(maxY, edgeY));

  // Pulsating opacity
  const opacity = 0.5 + 0.4 * Math.sin(tick * 0.1);

  // Rotation in degrees
  const rotDeg = (angle * 180) / Math.PI;

  return (
    <View
      style={[
        styles.arrowContainer,
        {
          left: edgeX - 12,
          top: edgeY - 12,
          opacity,
          transform: [{ rotate: `${rotDeg}deg` }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Triangle arrow using border trick */}
      <View
        style={[
          styles.arrow,
          {
            borderLeftColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  arrowContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 14,
    borderLeftColor: '#ffffff', // overridden by inline style
  },
});
