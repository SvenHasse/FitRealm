// GLBTestScreen.tsx
// Minimal proof-of-concept: render the forest_border.glb model using expo-gl + three + expo-three
// This screen is temporary — for testing 3D rendering performance on device.

import React, { Suspense, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import * as ExpoThree from 'expo-three';
// @ts-ignore — no type declarations for JSM examples
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Shared debug state (simple ref-based for cross-component access) ────────
let _debugInfo = { loadInfo: 'Starte...', error: '' };
let _debugListener: (() => void) | null = null;

// ─── GLB Model Loader ───────────────────────────────────────────────────────

function ForestModel() {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadInfo, setLoadInfoLocal] = useState('Starte...');

  const setLoadInfo = (msg: string) => {
    setLoadInfoLocal(msg);
    _debugInfo.loadInfo = msg;
    _debugListener?.();
  };
  const setErrorAndDebug = (msg: string) => {
    setError(msg);
    _debugInfo.error = msg;
    _debugListener?.();
  };

  React.useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        setLoadInfo('Asset laden...');
        // Resolve asset to local file via expo-asset
        const asset = Asset.fromModule(require('../assets/terrain/forest_border.glb'));
        await asset.downloadAsync();

        if (cancelled) return;

        // Get the actual local file URI
        const uri = asset.localUri;
        if (!uri) {
          setErrorAndDebug('No localUri after download');
          return;
        }
        setLoadInfo(`URI: ${uri.slice(-40)}`);

        // Read as binary using XMLHttpRequest (more reliable than fetch for file:// URIs)
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', uri, true);
          xhr.responseType = 'arraybuffer';
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) {
              resolve(xhr.response);
            } else {
              reject(new Error(`XHR status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('XHR error'));
          xhr.send();
        });

        if (cancelled) return;
        setLoadInfo(`Bytes: ${arrayBuffer.byteLength}`);

        const loader = new GLTFLoader();
        loader.parse(
          arrayBuffer,
          '',
          (gltf: any) => {
            if (cancelled) return;
            // Center the model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);

            // Scale to reasonable size
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 10 / maxDim;
            gltf.scene.scale.setScalar(scale);

            // Count meshes for debug info
            let meshCount = 0;
            gltf.scene.traverse((child: any) => { if (child.isMesh) meshCount++; });
            setLoadInfo(`OK! ${meshCount} meshes, scale=${scale.toFixed(2)}`);

            setScene(gltf.scene);
          },
          (err: any) => {
            if (cancelled) return;
            setErrorAndDebug(`GLB parse: ${String(err).slice(0, 100)}`);
          }
        );
      } catch (e: any) {
        if (cancelled) return;
        setErrorAndDebug(`Load: ${e.message}`);
      }
    }

    loadModel();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    console.warn('ForestModel error:', error);
    return null;
  }

  if (!scene) return null;

  return <primitive object={scene} />;
}

// ─── Slow auto-rotation so we can inspect the model ──────────────────────────

function AutoRotate() {
  const { scene } = useThree();
  useFrame((_, delta) => {
    scene.rotation.y += delta * 0.15;
  });
  return null;
}

// ─── Isometric Camera Setup ──────────────────────────────────────────────────

function IsometricCamera() {
  const { camera } = useThree();

  React.useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      // Isometric angle: look from top-right corner
      const dist = 15;
      const angle = Math.PI / 4; // 45° around Y
      const tilt = Math.atan(1 / Math.sqrt(2)); // ~35.26° (true isometric)

      camera.position.set(
        dist * Math.sin(angle) * Math.cos(tilt),
        dist * Math.sin(tilt),
        dist * Math.cos(angle) * Math.cos(tilt),
      );
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

// ─── FPS Counter ─────────────────────────────────────────────────────────────

function FPSCounter({ onFPS }: { onFPS: (fps: number) => void }) {
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

// ─── Loading Fallback ────────────────────────────────────────────────────────

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4CAF50" />
    </mesh>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

interface GLBTestScreenProps {
  onBack?: () => void;
}

export default function GLBTestScreen({ onBack }: GLBTestScreenProps) {
  const [fps, setFPS] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [debugStr, setDebugStr] = useState('Starte...');

  React.useEffect(() => {
    _debugListener = () => {
      const s = _debugInfo.error || _debugInfo.loadInfo;
      setDebugStr(s);
    };
    return () => { _debugListener = null; };
  }, []);

  const handleFPS = useCallback((f: number) => setFPS(f), []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Zurück</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>3D Forest PoC</Text>
        <View style={styles.fpsBox}>
          <Text style={[styles.fpsText, { color: fps >= 30 ? '#4CAF50' : fps >= 15 ? '#FF9800' : '#F44336' }]}>
            {fps} FPS
          </Text>
        </View>
      </View>

      {/* 3D Canvas */}
      <View style={styles.canvasContainer}>
        <Canvas
          orthographic
          camera={{
            zoom: 40,
            near: 0.1,
            far: 1000,
            position: [10, 10, 10],
          }}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={() => setLoadState('ready')}
          style={{ flex: 1 }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.2}
            castShadow
            color="#fff5e6"
          />
          <directionalLight
            position={[-5, 8, -5]}
            intensity={0.4}
            color="#e6f0ff"
          />

          {/* Camera + rotation */}
          <IsometricCamera />
          <AutoRotate />
          <FPSCounter onFPS={handleFPS} />

          {/* Model */}
          <Suspense fallback={<LoadingFallback />}>
            <ForestModel />
          </Suspense>
        </Canvas>

        {/* Loading overlay */}
        {loadState === 'loading' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.loadingText}>Lade 3D-Modell...</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Modell: forest_border.glb (1.6 MB){'\n'}
          Renderer: expo-gl + three.js{'\n'}
          Status: {debugStr}
        </Text>
        <Text style={[styles.infoHint, _debugInfo.error ? { color: '#F44336' } : null]}>
          {_debugInfo.error ? `FEHLER: ${_debugInfo.error}` : 'Grün = ≥30 FPS = brauchbar.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e1016' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 16, paddingBottom: 8,
    backgroundColor: '#151820', borderBottomWidth: 1, borderBottomColor: '#2a2f40',
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: '#F5A623', fontSize: 15, fontWeight: '600' },
  title: { color: '#d0d4e0', fontSize: 17, fontWeight: 'bold' },
  fpsBox: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  fpsText: { fontSize: 14, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  canvasContainer: { flex: 1, backgroundColor: '#1a2a1a' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,16,22,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: '#d0d4e0', fontSize: 14, marginTop: 12 },
  infoBar: {
    backgroundColor: '#151820', padding: 12,
    borderTopWidth: 1, borderTopColor: '#2a2f40',
  },
  infoText: { color: '#606880', fontSize: 11, lineHeight: 18 },
  infoHint: { color: '#F5A623', fontSize: 11, marginTop: 6 },
});
