import React from 'react';
import { Image } from 'react-native';

// Sprite: village-assets/obstacles/small_rock.png → copy to src/assets/obstacles/small_rock.png
const SPRITE = require('../../assets/obstacles/small_rock.png');

interface SmallRockProps {
  size?: number;
}

export const SmallRock: React.FC<SmallRockProps> = ({ size = 80 }) => {
  return (
    <Image
      source={SPRITE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

export default SmallRock;
