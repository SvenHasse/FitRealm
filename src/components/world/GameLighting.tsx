import React from 'react';

export function GameLighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.2}
        color="#fff8f0"
        castShadow={false}
      />
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.3}
        color="#e0e8ff"
        castShadow={false}
      />
    </>
  );
}
