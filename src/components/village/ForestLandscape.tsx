// ForestLandscape.tsx
// FitRealm - Zone-based naturalistic forest landscape using pre-rendered 3D sprites

import React, { useMemo } from 'react';
import { Image } from 'react-native';
import { NatureSprites } from '../../assets/nature-sprites';
import { generateAllForestElements } from './forestZones';

interface Props {
  gridSize: number;
  borderSize: number;
}

function ForestLandscapeInner({ gridSize, borderSize }: Props) {
  const elements = useMemo(
    () => generateAllForestElements(gridSize, borderSize),
    [gridSize, borderSize],
  );

  return (
    <>
      {elements.map((el, i) => (
        <Image
          key={`fl-${i}`}
          source={NatureSprites[el.sprite]}
          style={{
            position: 'absolute',
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            opacity: el.opacity ?? 1,
            transform: el.flipX ? [{ scaleX: -1 }] : undefined,
          }}
          resizeMode="contain"
        />
      ))}
    </>
  );
}

const ForestLandscape = React.memo(ForestLandscapeInner);
export default ForestLandscape;
