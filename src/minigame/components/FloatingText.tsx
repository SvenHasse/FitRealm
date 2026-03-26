// FloatingText.tsx — Schwebende Texte (Schadenszahlen, "+1", "BONK!" etc.)

import React from 'react';
import { G, Text as SvgText } from 'react-native-svg';
import { FloatingText as FloatingTextType } from '../types';

interface Props {
  texts: FloatingTextType[];
}

export default function FloatingTextLayer({ texts }: Props) {
  return (
    <G>
      {texts.map(ft => (
        <SvgText
          key={ft.id}
          x={ft.position.x}
          y={ft.position.y + ft.offsetY}
          fill={ft.color}
          opacity={ft.opacity}
          fontSize={ft.fontSize}
          fontWeight="bold"
          textAnchor="middle"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.5}
        >
          {ft.text}
        </SvgText>
      ))}
    </G>
  );
}
