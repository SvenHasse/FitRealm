// HydraSchuppe.tsx
// FitRealm — Trophäe: Schuppe der Verderbnis-Hydra

import React from 'react';
import Svg, { Polygon, Rect, Line } from 'react-native-svg';

interface HydraSchuppeProps {
  size?: number;
}

const HydraSchuppe: React.FC<HydraSchuppeProps> = ({ size = 40 }) => {
  const w = 40;
  const h = 50;

  return (
    <Svg width={size} height={size * (h / w)} viewBox={`0 0 ${w} ${h}`}>
      {/* Ständer: kleiner Holzständer unten */}
      <Rect x={16} y={42} width={8} height={5} fill="#8B7355" />
      <Rect x={12} y={46} width={16} height={3} fill="#6D5A3F" />
      {/* Schuppe: Tränenform-Polygon, schimmerndes Grün */}
      <Polygon points="20,2 32,20 28,38 20,40 12,38 8,20" fill="#2E7D32" />
      {/* Bläulicher Schimmer-Overlay */}
      <Polygon points="20,2 32,20 28,38 20,40 12,38 8,20" fill="#1565C0" opacity={0.3} />
      {/* Highlight oben */}
      <Polygon points="20,2 26,12 20,16 14,12" fill="#FFFFFF" opacity={0.2} />
      {/* Textur: 2-3 kleine diagonale Linien */}
      <Line x1={14} y1={18} x2={22} y2={12} stroke="#4CAF50" strokeWidth={0.8} opacity={0.6} />
      <Line x1={16} y1={26} x2={26} y2={18} stroke="#4CAF50" strokeWidth={0.8} opacity={0.5} />
      <Line x1={14} y1={34} x2={22} y2={28} stroke="#4CAF50" strokeWidth={0.8} opacity={0.4} />
    </Svg>
  );
};

export default HydraSchuppe;
