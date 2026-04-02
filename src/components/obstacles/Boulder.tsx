import React from 'react';
import { Image } from 'react-native';

// Sprite: village-assets/obstacles/boulder.png → copy to src/assets/obstacles/boulder.png
const SPRITE = require('../../assets/obstacles/boulder.png');

interface BoulderProps {
  size?: number;
}

export const Boulder: React.FC<BoulderProps> = ({ size = 80 }) => {
  return (
    <Image
      source={SPRITE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

export default Boulder;
