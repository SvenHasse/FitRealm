// GolemHerz.tsx
// FitRealm — Trophäe: Herz des Uralten Golems

import React from 'react';
import Svg, { Rect, Polygon, Circle } from 'react-native-svg';

interface GolemHerzProps {
  size?: number;
}

const GolemHerz: React.FC<GolemHerzProps> = ({ size = 40 }) => {
  const scale = size / 40;
  const w = 40;
  const h = 50;

  return (
    <Svg width={size} height={size * (h / w)} viewBox={`0 0 ${w} ${h}`}>
      {/* Sockel: grauer Quader unten */}
      <Polygon points="12,42 28,42 30,48 10,48" fill="#78909C" />
      <Polygon points="10,48 30,48 28,50 12,50" fill="#546E7A" />
      {/* Kristall: Rauten-Form oben, leuchtendes Lila */}
      <Polygon points="20,4 30,18 20,32 10,18" fill="#9C27B0" />
      {/* Glow-Overlay (transluzent) */}
      <Polygon points="20,4 30,18 20,32 10,18" fill="#CE93D8" opacity={0.3} />
      {/* Kleine weiße Highlights */}
      <Polygon points="20,4 25,12 20,14 15,12" fill="#FFFFFF" opacity={0.25} />
      {/* Kleines Leuchten: weißer Kreis im Zentrum */}
      <Circle cx={20} cy={18} r={3} fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
};

export default GolemHerz;
