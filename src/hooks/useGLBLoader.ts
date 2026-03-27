import { useState, useEffect } from 'react';
import { Asset } from 'expo-asset';
// @ts-ignore — no type declarations for JSM examples
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export function useGLBLoader(assetModule: number) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        if (cancelled) return;

        const uri = asset.localUri;
        if (!uri) { setError('No localUri'); setLoading(false); return; }

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', uri, true);
          xhr.responseType = 'arraybuffer';
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) resolve(xhr.response);
            else reject(new Error(`XHR ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('XHR error'));
          xhr.send();
        });

        if (cancelled) return;

        const loader = new GLTFLoader();
        loader.parse(arrayBuffer, '', (gltf: any) => {
          if (cancelled) return;
          // Enable flat shading on all meshes
          gltf.scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
              child.material.flatShading = true;
              child.material.needsUpdate = true;
            }
          });
          setScene(gltf.scene);
          setLoading(false);
        }, (err: any) => {
          if (!cancelled) { setError(String(err)); setLoading(false); }
        });
      } catch (e: any) {
        if (!cancelled) { setError(e.message); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [assetModule]);

  return { scene, loading, error };
}
