import React from 'react';
import { Image } from 'react-native';

// Sprite: village-assets/obstacles/mushrooms.png → copy to src/assets/obstacles/mushrooms.png
const SPRITE = require('../../assets/obstacles/mushrooms.png');

interface MushroomsProps {
  size?: number;
}

export const Mushrooms: React.FC<MushroomsProps> = ({ size = 80 }) => {
  return (
    <Image
      source={SPRITE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

export default Mushrooms;
