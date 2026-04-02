import React from 'react';
import { Image } from 'react-native';

// Sprite: village-assets/obstacles/branch.png → copy to src/assets/obstacles/branch.png
const SPRITE = require('../../assets/obstacles/branch.png');

interface BranchProps {
  size?: number;
}

export const Branch: React.FC<BranchProps> = ({ size = 80 }) => {
  return (
    <Image
      source={SPRITE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

export default Branch;
