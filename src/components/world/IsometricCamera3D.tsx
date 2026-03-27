import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IsometricCamera3DProps {
  targetX: number;
  targetZ: number;
  zoom: number;
}

export function IsometricCamera3D({ targetX, targetZ, zoom }: IsometricCamera3DProps) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [zoom, camera]);

  useFrame(() => {
    // Smooth camera movement to target
    currentTarget.current.x += (targetX - currentTarget.current.x) * 0.05;
    currentTarget.current.z += (targetZ - currentTarget.current.z) * 0.05;

    const dist = 50;
    const angle = Math.PI / 4;
    const tilt = Math.atan(1 / Math.sqrt(2));

    camera.position.set(
      currentTarget.current.x + dist * Math.sin(angle) * Math.cos(tilt),
      dist * Math.sin(tilt),
      currentTarget.current.z + dist * Math.cos(angle) * Math.cos(tilt),
    );
    camera.lookAt(currentTarget.current.x, 0, currentTarget.current.z);
  });

  return null;
}
