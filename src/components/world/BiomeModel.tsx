import React from 'react';
import { useGLBLoader } from '../../hooks/useGLBLoader';

const BIOME_ASSETS: Record<string, number> = {
  forest: require('../../assets/terrain/spielfeld_wald_border.glb'),
  desert: require('../../assets/terrain/spielfeld_wueste_border.glb'),
  mountains: require('../../assets/terrain/spielfeld_berge_border.glb'),
};

interface BiomeModelProps {
  biome: string;
  position?: [number, number, number];
  visible?: boolean;
}

export function BiomeModel({ biome, position = [0, 0, 0], visible = true }: BiomeModelProps) {
  const assetModule = BIOME_ASSETS[biome];
  const { scene, loading, error } = useGLBLoader(assetModule);

  if (!visible || loading || error || !scene) return null;

  return <primitive object={scene} position={position} />;
}
