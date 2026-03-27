import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLBLoader } from '../../hooks/useGLBLoader';
import * as THREE from 'three';

const CLOUD_ASSETS: Record<string, number> = {
  desert: require('../../assets/terrain/wolken_wueste.glb'),
  mountains: require('../../assets/terrain/wolken_berge.glb'),
};

interface CloudOverlay3DProps {
  biome: 'desert' | 'mountains';
  visible: boolean;
  dissolving?: boolean;
}

export function CloudOverlay3D({ biome, visible, dissolving = false }: CloudOverlay3DProps) {
  const { scene, loading } = useGLBLoader(CLOUD_ASSETS[biome]);
  const groupRef = useRef<THREE.Group>(null);
  const dissolveProgress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Gentle floating animation
    groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.3;

    // Dissolve animation
    if (dissolving) {
      dissolveProgress.current = Math.min(1, dissolveProgress.current + delta * 0.5);
      const s = 1 + dissolveProgress.current * 0.3;
      groupRef.current.scale.set(s, s, s);
      groupRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 1 - dissolveProgress.current;
        }
      });
    }
  });

  if (!visible || loading || !scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}
