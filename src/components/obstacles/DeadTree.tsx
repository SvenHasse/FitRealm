import React from 'react';
import { Image } from 'react-native';

// Sprite: village-assets/obstacles/dead_tree.png → copy to src/assets/obstacles/dead_tree.png
const SPRITE = require('../../assets/obstacles/dead_tree.png');

interface DeadTreeProps {
  size?: number;
}

export const DeadTree: React.FC<DeadTreeProps> = ({ size = 80 }) => {
  return (
    <Image
      source={SPRITE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

export default DeadTree;
