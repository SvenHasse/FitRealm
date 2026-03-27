import React, { Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { GameLighting } from './GameLighting';
import { BiomeModel } from './BiomeModel';
import { CloudOverlay3D } from './CloudOverlay3D';
import { IsometricCamera3D } from './IsometricCamera3D';
import { FPSCounter3D } from './FPSCounter3D';
import { BIOME_CENTERS, BiomeKey } from '../../utils/worldCoordinates';

interface WorldRendererProps {
  activeBiome: BiomeKey;
  unlockedBiomes: Set<BiomeKey>;
  dissolvingBiome?: BiomeKey | null;
  zoom?: number;
  onFPS?: (fps: number) => void;
}

export function WorldRenderer({
  activeBiome,
  unlockedBiomes,
  dissolvingBiome = null,
  zoom = 25,
  onFPS,
}: WorldRendererProps) {
  const target = BIOME_CENTERS[activeBiome];

  return (
    <View style={styles.container}>
      <Canvas
        orthographic
        camera={{ zoom, near: 0.1, far: 500, position: [30, 30, 30] }}
        style={styles.canvas}
        gl={{ antialias: false }}
      >
        <GameLighting />
        <IsometricCamera3D targetX={target.x} targetZ={target.z} zoom={zoom} />

        {onFPS && <FPSCounter3D onFPS={onFPS} />}

        {/* Load active biome + neighbors */}
        <Suspense fallback={null}>
          <BiomeModel biome="forest" position={[0, 0, 0]} />
          <BiomeModel biome="desert" position={[-40, 0, 0]} visible={unlockedBiomes.has('desert') || activeBiome === 'desert'} />
          <BiomeModel biome="mountains" position={[40, 0, 0]} visible={unlockedBiomes.has('mountains') || activeBiome === 'mountains'} />
        </Suspense>

        {/* Clouds over locked biomes */}
        {!unlockedBiomes.has('desert') && (
          <CloudOverlay3D biome="desert" visible={true} dissolving={dissolvingBiome === 'desert'} />
        )}
        {!unlockedBiomes.has('mountains') && (
          <CloudOverlay3D biome="mountains" visible={true} dissolving={dissolvingBiome === 'mountains'} />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvas: { flex: 1 },
});
