import React from 'react';
import { Image } from 'react-native';

// Sprite: village-assets/obstacles/large_tree.png → copy to src/assets/obstacles/large_tree.png
const SPRITE = require('../../assets/obstacles/large_tree.png');

interface LargeTreeProps {
  size?: number;
}

export const LargeTree: React.FC<LargeTreeProps> = ({ size = 80 }) => {
  return (
    <Image
      source={SPRITE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

export default LargeTree;
