// Snowflakes.tsx — Performante Schneefall-Animation als SVG-Overlay

import React, { useRef, useMemo } from 'react';
import { G, Circle } from 'react-native-svg';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

interface Flake {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speed: number;
  drift: number;   // Amplitude der seitlichen Sin-Bewegung
  phase: number;    // Startphase der Sin-Kurve
}

interface Props {
  tick: number;
  cameraX: number;
  cameraY: number;
  viewWidth: number;
  viewHeight: number;
}

const NUM_FLAKES = 70;

function createFlakes(): Flake[] {
  const flakes: Flake[] = [];
  for (let i = 0; i < NUM_FLAKES; i++) {
    flakes.push({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      r: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.4,
      speed: 0.3 + Math.random() * 0.5,
      drift: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return flakes;
}

export default function Snowflakes({ tick, cameraX, cameraY, viewWidth, viewHeight }: Props) {
  const flakesRef = useRef<Flake[]>(createFlakes());
  const flakes = flakesRef.current;

  // Update flake positions based on tick
  const margin = 50;
  const visLeft = cameraX - margin;
  const visRight = cameraX + viewWidth + margin;
  const visTop = cameraY - margin;
  const visBottom = cameraY + viewHeight + margin;

  // Move flakes
  for (let i = 0; i < flakes.length; i++) {
    const f = flakes[i];
    f.y += f.speed;
    f.x += Math.sin(tick * 0.02 + f.phase) * f.drift * 0.3;

    // Reset if below world or far off-screen
    if (f.y > WORLD_HEIGHT + 20) {
      f.y = -10;
      f.x = Math.random() * WORLD_WIDTH;
    }
  }

  // Only render visible flakes
  const visibleFlakes = useMemo(() => {
    const visible: { key: number; x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      if (f.x >= visLeft && f.x <= visRight && f.y >= visTop && f.y <= visBottom) {
        visible.push({ key: i, x: f.x, y: f.y, r: f.r, o: f.opacity });
      }
    }
    return visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]); // tick dependency triggers recalculation

  return (
    <G>
      {visibleFlakes.map(f => (
        <Circle
          key={f.key}
          cx={f.x}
          cy={f.y}
          r={f.r}
          fill="white"
          opacity={f.o}
        />
      ))}
    </G>
  );
}
