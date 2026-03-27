import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function FPSCounter3D({ onFPS }: { onFPS: (fps: number) => void }) {
  const frames = useRef(0);
  const lastTime = useRef(Date.now());

  useFrame(() => {
    frames.current++;
    const now = Date.now();
    if (now - lastTime.current >= 1000) {
      onFPS(frames.current);
      frames.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}
