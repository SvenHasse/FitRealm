import React from 'react';
import Svg, { Polygon, Rect, Line, Circle, Ellipse, Path } from 'react-native-svg';

interface StallProps {
  level?: 1 | 2 | 3 | 4 | 5;
  size?: number;
}

export const Stall: React.FC<StallProps> = ({ level = 1, size = 120 }) => {
  const visualLevel = level >= 5 ? 5 : level >= 3 ? 3 : 1;

  if (visualLevel === 1) {
    // Small wooden stall, open door, hay structure
    return (
      <Svg width={size} height={size * 1.1} viewBox="0 0 80 90">
        {/* Ground platform - green grass */}
        <Polygon points="40,74 72,86 40,90 8,86" fill="#4A7C3F"/>
        <Polygon points="8,83 40,87 40,90 8,86" fill="#3A6432"/>
        <Polygon points="40,87 72,83 72,86 40,90" fill="#2E5228"/>
        {/* Main barn walls */}
        <Polygon points="14,58 40,68 40,86 14,76" fill="#C4934A"/>
        <Polygon points="40,68 66,58 66,76 40,86" fill="#A87840"/>
        {/* Wood plank lines - left wall */}
        <Line x1="14" y1="64" x2="40" y2="74" stroke="#9A7030" strokeWidth="0.7" opacity="0.6"/>
        <Line x1="14" y1="70" x2="40" y2="80" stroke="#9A7030" strokeWidth="0.7" opacity="0.6"/>
        {/* Wood plank lines - right wall */}
        <Line x1="40" y1="74" x2="66" y2="64" stroke="#8A6020" strokeWidth="0.7" opacity="0.6"/>
        <Line x1="40" y1="80" x2="66" y2="70" stroke="#8A6020" strokeWidth="0.7" opacity="0.6"/>
        {/* Hip roof */}
        <Polygon points="14,58 40,48 40,68" fill="#D4A843"/>
        <Polygon points="40,48 66,58 40,68" fill="#B89028"/>
        {/* Roof ridge cap */}
        <Line x1="36" y1="48" x2="44" y2="48" stroke="#8B7355" strokeWidth="1.5"/>
        {/* Door opening */}
        <Polygon points="28,84 28,72 34,68 40,72 40,84" fill="#4A2E0E"/>
        {/* Door frame */}
        <Line x1="28" y1="72" x2="34" y2="68" stroke="#3A2208" strokeWidth="1"/>
        <Line x1="34" y1="68" x2="40" y2="72" stroke="#3A2208" strokeWidth="1"/>
        {/* Hay bale right side */}
        <Ellipse cx="59" cy="82" rx="6" ry="3.5" fill="#C09030"/>
        <Ellipse cx="59" cy="80" rx="6" ry="3.5" fill="#D4A843"/>
        <Line x1="53" y1="80" x2="65" y2="80" stroke="#B89028" strokeWidth="0.8"/>
        {/* Hay loft window */}
        <Rect x="44" y="61" width="10" height="7" fill="#D4A843" opacity="0.75"/>
        <Line x1="49" y1="61" x2="49" y2="68" stroke="#B89028" strokeWidth="0.8"/>
      </Svg>
    );
  }

  if (visualLevel === 3) {
    // Larger stall with fence, 2 animal silhouettes
    return (
      <Svg width={size * 1.2} height={size * 1.3} viewBox="0 0 80 90">
        {/* Ground */}
        <Polygon points="40,74 72,86 40,90 8,86" fill="#4A7C3F"/>
        <Polygon points="8,83 40,87 40,90 8,86" fill="#3A6432"/>
        <Polygon points="40,87 72,83 72,86 40,90" fill="#2E5228"/>
        {/* Fence posts */}
        <Rect x="6" y="76" width="2.5" height="10" fill="#8B7355"/>
        <Rect x="12" y="77" width="2.5" height="9" fill="#8B7355"/>
        <Line x1="6" y1="79" x2="14" y2="80" stroke="#8B7355" strokeWidth="1.5"/>
        <Line x1="6" y1="82" x2="14" y2="83" stroke="#8B7355" strokeWidth="1.5"/>
        <Rect x="60" y="74" width="2.5" height="10" fill="#8B7355"/>
        <Rect x="66" y="75" width="2.5" height="9" fill="#8B7355"/>
        <Line x1="60" y1="77" x2="68" y2="78" stroke="#8B7355" strokeWidth="1.5"/>
        <Line x1="60" y1="80" x2="68" y2="81" stroke="#8B7355" strokeWidth="1.5"/>
        {/* Main walls - bigger barn */}
        <Polygon points="12,52 40,64 40,86 12,74" fill="#C4934A"/>
        <Polygon points="40,64 68,52 68,74 40,86" fill="#A87840"/>
        {/* Plank lines */}
        <Line x1="12" y1="58" x2="40" y2="70" stroke="#9A7030" strokeWidth="0.7" opacity="0.6"/>
        <Line x1="12" y1="64" x2="40" y2="76" stroke="#9A7030" strokeWidth="0.7" opacity="0.6"/>
        <Line x1="12" y1="70" x2="40" y2="82" stroke="#9A7030" strokeWidth="0.7" opacity="0.6"/>
        <Line x1="40" y1="70" x2="68" y2="58" stroke="#8A6020" strokeWidth="0.7" opacity="0.6"/>
        <Line x1="40" y1="76" x2="68" y2="64" stroke="#8A6020" strokeWidth="0.7" opacity="0.6"/>
        {/* Roof */}
        <Polygon points="12,52 40,42 40,64" fill="#D4A843"/>
        <Polygon points="40,42 68,52 40,64" fill="#B89028"/>
        <Line x1="36" y1="42" x2="44" y2="42" stroke="#8B7355" strokeWidth="1.5"/>
        {/* Door */}
        <Polygon points="26,84 26,70 34,66 42,70 42,84" fill="#4A2E0E"/>
        <Line x1="26" y1="70" x2="34" y2="66" stroke="#3A2208" strokeWidth="1"/>
        <Line x1="34" y1="66" x2="42" y2="70" stroke="#3A2208" strokeWidth="1"/>
        {/* Animal silhouettes inside (visible through opening) */}
        <Ellipse cx="20" cy="82" rx="5" ry="3" fill="#6D4C2E" opacity="0.6"/>
        <Circle cx="17" cy="79" r="2.5" fill="#6D4C2E" opacity="0.6"/>
        {/* Hay window */}
        <Rect x="46" y="56" width="12" height="8" fill="#D4A843" opacity="0.8"/>
        <Line x1="52" y1="56" x2="52" y2="64" stroke="#B89028" strokeWidth="0.8"/>
        <Line x1="46" y1="60" x2="58" y2="60" stroke="#B89028" strokeWidth="0.8"/>
        {/* Hay bales */}
        <Ellipse cx="62" cy="82" rx="5" ry="3" fill="#C09030"/>
        <Ellipse cx="62" cy="80" rx="5" ry="3" fill="#D4A843"/>
        {/* Weather vane */}
        <Line x1="40" y1="42" x2="40" y2="34" stroke="#8B7355" strokeWidth="1"/>
        <Polygon points="40,34 46,37 40,38" fill="#C4934A"/>
      </Svg>
    );
  }

  // Level 5 - Grand stable: stone base, banner, torch, multiple animals
  return (
    <Svg width={size * 1.4} height={size * 1.5} viewBox="0 0 80 90">
      {/* Ground */}
      <Polygon points="40,74 76,87 40,91 4,87" fill="#4A7C3F"/>
      <Polygon points="4,84 40,88 40,91 4,87" fill="#3A6432"/>
      <Polygon points="40,88 76,84 76,87 40,91" fill="#2E5228"/>
      {/* Stone base (lower portion) */}
      <Polygon points="10,68 40,78 40,86 10,76" fill="#9E8E70"/>
      <Polygon points="40,78 70,68 70,76 40,86" fill="#8A7A60"/>
      {/* Stone texture lines */}
      <Line x1="10" y1="72" x2="40" y2="82" stroke="#7A6A50" strokeWidth="0.8" opacity="0.5"/>
      <Line x1="40" y1="82" x2="70" y2="72" stroke="#6A5A40" strokeWidth="0.8" opacity="0.5"/>
      {/* Wooden upper walls */}
      <Polygon points="10,52 40,62 40,78 10,68" fill="#C4934A"/>
      <Polygon points="40,62 70,52 70,68 40,78" fill="#A87840"/>
      {/* Plank lines */}
      <Line x1="10" y1="57" x2="40" y2="67" stroke="#9A7030" strokeWidth="0.7" opacity="0.5"/>
      <Line x1="10" y1="62" x2="40" y2="72" stroke="#9A7030" strokeWidth="0.7" opacity="0.5"/>
      <Line x1="40" y1="67" x2="70" y2="57" stroke="#8A6020" strokeWidth="0.7" opacity="0.5"/>
      <Line x1="40" y1="72" x2="70" y2="62" stroke="#8A6020" strokeWidth="0.7" opacity="0.5"/>
      {/* Roof */}
      <Polygon points="10,52 40,40 40,62" fill="#D4A843"/>
      <Polygon points="40,40 70,52 40,62" fill="#B89028"/>
      <Line x1="35" y1="40" x2="45" y2="40" stroke="#8B7355" strokeWidth="2"/>
      {/* Grand door */}
      <Polygon points="26,84 26,68 34,64 42,68 42,84" fill="#4A2E0E"/>
      <Polygon points="30,84 30,70 34,67 38,70 38,84" fill="#3A2208"/>
      <Circle cx="30" cy="77" r="1" fill="#F5A623"/>
      {/* Stone torches */}
      <Rect x="8" y="66" width="4" height="7" fill="#9E8E70"/>
      <Circle cx="10" cy="65" r="2.5" fill="#FF8F00"/>
      <Circle cx="10" cy="65" r="1.5" fill="#FFD54F"/>
      <Rect x="66" y="64" width="4" height="7" fill="#9E8E70"/>
      <Circle cx="68" cy="63" r="2.5" fill="#FF8F00"/>
      <Circle cx="68" cy="63" r="1.5" fill="#FFD54F"/>
      {/* Banner/flag */}
      <Line x1="40" y1="40" x2="40" y2="28" stroke="#8B7355" strokeWidth="1.5"/>
      <Polygon points="40,28 52,31 40,35" fill="#E53935"/>
      <Rect x="43" y="30" width="5" height="3" fill="#F5A623" opacity="0.8"/>
      {/* Animal silhouettes inside */}
      <Ellipse cx="18" cy="80" rx="5" ry="3" fill="#5D4037" opacity="0.7"/>
      <Circle cx="15" cy="77" r="2.5" fill="#5D4037" opacity="0.7"/>
      {/* Hay loft window */}
      <Rect x="46" y="54" width="14" height="9" fill="#D4A843" opacity="0.85"/>
      <Line x1="53" y1="54" x2="53" y2="63" stroke="#B89028" strokeWidth="0.9"/>
      <Line x1="46" y1="58" x2="60" y2="58" stroke="#B89028" strokeWidth="0.9"/>
      {/* Hay bales stacked */}
      <Ellipse cx="62" cy="84" rx="5" ry="3" fill="#C09030"/>
      <Ellipse cx="62" cy="82" rx="5" ry="3" fill="#D4A843"/>
      <Ellipse cx="62" cy="80" rx="5" ry="3" fill="#C09030"/>
    </Svg>
  );
};

export default Stall;
