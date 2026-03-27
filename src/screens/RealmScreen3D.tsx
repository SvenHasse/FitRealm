import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorldRenderer } from '../components/world/WorldRenderer';
import { BiomeKey } from '../utils/worldCoordinates';

const SCREEN_W = Dimensions.get('window').width;

interface RealmScreen3DProps {
  onBack?: () => void;
}

export default function RealmScreen3D({ onBack }: RealmScreen3DProps) {
  const [activeBiome, setActiveBiome] = useState<BiomeKey>('forest');
  const [unlockedBiomes] = useState(new Set<BiomeKey>(['forest']));
  const [fps, setFPS] = useState(0);
  const [zoom, setZoom] = useState(25);

  const handleFPS = useCallback((f: number) => setFPS(f), []);

  const biomes: BiomeKey[] = ['desert', 'forest', 'mountains'];
  const currentIdx = biomes.indexOf(activeBiome);

  return (
    <View style={styles.container}>
      {/* 3D World */}
      <WorldRenderer
        activeBiome={activeBiome}
        unlockedBiomes={unlockedBiomes}
        zoom={zoom}
        onFPS={handleFPS}
      />

      {/* HUD Overlay */}
      <View style={styles.hud} pointerEvents="box-none">
        {/* FPS */}
        <View style={styles.fpsBox}>
          <Text style={styles.fpsText}>{fps} FPS</Text>
        </View>

        {/* Biome navigation */}
        <View style={styles.biomeNav}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => currentIdx > 0 && setActiveBiome(biomes[currentIdx - 1])}
            disabled={currentIdx <= 0}
          >
            <Ionicons name="chevron-back" size={24} color={currentIdx > 0 ? '#FFD700' : '#333'} />
          </TouchableOpacity>

          <View style={styles.biomeLabel}>
            <Text style={styles.biomeLabelText}>
              {activeBiome === 'forest' ? 'Wald' : activeBiome === 'desert' ? 'Wueste' : 'Berge'}
            </Text>
            {!unlockedBiomes.has(activeBiome) && (
              <Text style={styles.lockedText}>Gesperrt</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => currentIdx < biomes.length - 1 && setActiveBiome(biomes[currentIdx + 1])}
            disabled={currentIdx >= biomes.length - 1}
          >
            <Ionicons name="chevron-forward" size={24} color={currentIdx < biomes.length - 1 ? '#FFD700' : '#333'} />
          </TouchableOpacity>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom(z => Math.min(50, z + 5))}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom(z => Math.max(10, z - 5))}>
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#091808' },
  hud: { ...StyleSheet.absoluteFillObject },
  fpsBox: {
    position: 'absolute', top: 50, left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  fpsText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },
  biomeNav: {
    position: 'absolute', bottom: 100, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  navBtn: { padding: 12 },
  biomeLabel: { alignItems: 'center', minWidth: 120 },
  biomeLabelText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  lockedText: { color: '#888', fontSize: 12, marginTop: 2 },
  zoomControls: {
    position: 'absolute', right: 12, bottom: 200, gap: 8,
  },
  zoomBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
});
