import React from 'react';
import Svg, { Polygon, Rect, Circle } from 'react-native-svg';

interface MauerProps {
  level: number;
  size?: number;
}

export const Mauer: React.FC<MauerProps> = ({ level, size = 120 }) => {
  const visualLevel = level >= 5 ? 5 : level >= 3 ? 3 : 1;

  if (visualLevel === 1) {
    // Holzpalisade
    return (
      <Svg width={size} height={size * 1.125} viewBox="0 0 80 90">
        {/* Grasplattform */}
        <Polygon points="40,74 72,86 40,90 8,86" fill="#4A7C3F"/>
        <Polygon points="8,83 40,87 40,90 8,86" fill="#3A6432"/>
        <Polygon points="40,87 72,83 72,86 40,90" fill="#2E5228"/>
        {/* Basis-Querbalken links */}
        <Polygon points="12,78 40,84 40,86 12,80" fill="#8B7355"/>
        {/* Basis-Querbalken rechts */}
        <Polygon points="40,84 68,78 68,80 40,86" fill="#7A6348"/>
        {/* Palisaden-Balken (vertikal) */}
        <Rect x="12" y="62" width="6" height="20" fill="#A08B6E"/>
        <Polygon points="12,62 15,56 18,62" fill="#A08B6E"/>
        <Rect x="20" y="64" width="6" height="18" fill="#8B7355"/>
        <Polygon points="20,64 23,58 26,64" fill="#8B7355"/>
        <Rect x="28" y="63" width="6" height="19" fill="#A08B6E"/>
        <Polygon points="28,63 31,57 34,63" fill="#A08B6E"/>
        <Rect x="36" y="65" width="6" height="17" fill="#8B7355"/>
        <Polygon points="36,65 39,59 42,65" fill="#8B7355"/>
        <Rect x="44" y="63" width="6" height="19" fill="#A08B6E"/>
        <Polygon points="44,63 47,57 50,63" fill="#A08B6E"/>
        <Rect x="52" y="64" width="6" height="18" fill="#8B7355"/>
        <Polygon points="52,64 55,58 58,64" fill="#8B7355"/>
        <Rect x="60" y="62" width="6" height="20" fill="#A08B6E"/>
        <Polygon points="60,62 63,56 66,62" fill="#A08B6E"/>
        {/* Querstrebe oben */}
        <Polygon points="12,68 40,72 40,74 12,70" fill="#7A6348"/>
        <Polygon points="40,72 68,68 68,70 40,74" fill="#6A5438"/>
      </Svg>
    );
  }

  if (visualLevel === 3) {
    // Steinmauer mit Zinnen
    return (
      <Svg width={size} height={size * 1.125} viewBox="0 0 80 90">
        {/* Grasplattform */}
        <Polygon points="40,74 72,86 40,90 8,86" fill="#4A7C3F"/>
        <Polygon points="8,83 40,87 40,90 8,86" fill="#3A6432"/>
        <Polygon points="40,87 72,83 72,86 40,90" fill="#2E5228"/>
        {/* Mauerblock links */}
        <Polygon points="8,64 40,72 40,86 8,78" fill="#B0A090"/>
        {/* Mauerblock rechts */}
        <Polygon points="40,72 72,64 72,78 40,86" fill="#9E8E70"/>
        {/* Steinblock-Fugen horizontal */}
        <Polygon points="8,71 40,79 40,80 8,72" fill="#8A7A60" opacity="0.5"/>
        <Polygon points="40,79 72,71 72,72 40,80" fill="#7A6A50" opacity="0.5"/>
        {/* Steinblock-Fugen vertikal links (angedeutet) */}
        <Polygon points="24,64 25,64 25,79 24,79" fill="#8A7A60" opacity="0.4"/>
        {/* Zinnen oben (abwechselnd hoch/tief) */}
        <Rect x="8" y="58" width="7" height="8" fill="#B0A090"/>
        <Rect x="17" y="60" width="6" height="6" fill="#9E8E70"/>
        <Rect x="25" y="58" width="7" height="8" fill="#B0A090"/>
        <Rect x="34" y="60" width="6" height="6" fill="#9E8E70"/>
        <Rect x="42" y="58" width="7" height="8" fill="#B0A090"/>
        <Rect x="51" y="60" width="6" height="6" fill="#9E8E70"/>
        <Rect x="59" y="58" width="7" height="8" fill="#B0A090"/>
        <Rect x="67" y="60" width="5" height="6" fill="#9E8E70"/>
        {/* Fackelhalter links */}
        <Rect x="14" y="70" width="3" height="6" fill="#8A7A60"/>
        <Circle cx="15" cy="69" r="2.5" fill="#FF8C00" opacity="0.9"/>
        <Circle cx="15" cy="69" r="1.5" fill="#FFD54F"/>
        {/* Fackelhalter rechts */}
        <Rect x="62" y="68" width="3" height="6" fill="#8A7A60"/>
        <Circle cx="63" cy="67" r="2.5" fill="#FF8C00" opacity="0.9"/>
        <Circle cx="63" cy="67" r="1.5" fill="#FFD54F"/>
      </Svg>
    );
  }

  // Level 5 — Massive Mauer mit Eisenverstärkung und Wachposten
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90">
      {/* Grasplattform */}
      <Polygon points="40,74 76,87 40,91 4,87" fill="#4A7C3F"/>
      <Polygon points="4,84 40,88 40,91 4,87" fill="#3A6432"/>
      <Polygon points="40,88 76,84 76,87 40,91" fill="#2E5228"/>
      {/* Massive Mauerbasis links */}
      <Polygon points="4,62 40,72 40,88 4,78" fill="#B0A090"/>
      {/* Massive Mauerbasis rechts */}
      <Polygon points="40,72 76,62 76,78 40,88" fill="#9E8E70"/>
      {/* Eisenplatten-Verstärkung links */}
      <Polygon points="4,68 40,77 40,78 4,69" fill="#78909C" opacity="0.7"/>
      <Polygon points="4,74 40,83 40,84 4,75" fill="#78909C" opacity="0.7"/>
      {/* Eisenplatten-Verstärkung rechts */}
      <Polygon points="40,77 76,68 76,69 40,78" fill="#607D8B" opacity="0.7"/>
      <Polygon points="40,83 76,74 76,75 40,84" fill="#607D8B" opacity="0.7"/>
      {/* Zinnen unten */}
      <Rect x="4" y="56" width="8" height="8" fill="#B0A090"/>
      <Rect x="14" y="58" width="7" height="6" fill="#9E8E70"/>
      <Rect x="23" y="56" width="8" height="8" fill="#B0A090"/>
      <Rect x="33" y="58" width="7" height="6" fill="#9E8E70"/>
      <Rect x="42" y="56" width="8" height="8" fill="#B0A090"/>
      <Rect x="52" y="58" width="7" height="6" fill="#9E8E70"/>
      <Rect x="61" y="56" width="8" height="8" fill="#B0A090"/>
      <Rect x="70" y="58" width="6" height="6" fill="#9E8E70"/>
      {/* Wachposten-Erhöhung mittig */}
      <Polygon points="28,56 40,61 40,72 28,67" fill="#B0A090"/>
      <Polygon points="40,61 52,56 52,67 40,72" fill="#9E8E70"/>
      {/* Zinnen Wachposten */}
      <Rect x="27" y="50" width="5" height="8" fill="#B0A090"/>
      <Rect x="34" y="52" width="4" height="6" fill="#9E8E70"/>
      <Rect x="40" y="50" width="5" height="8" fill="#B0A090"/>
      <Rect x="47" y="52" width="4" height="6" fill="#9E8E70"/>
      <Rect x="53" y="50" width="4" height="8" fill="#B0A090"/>
      {/* Eisenverstärkung Wachposten */}
      <Polygon points="28,60 40,64 40,65 28,61" fill="#78909C" opacity="0.8"/>
      <Polygon points="40,64 52,60 52,61 40,65" fill="#607D8B" opacity="0.8"/>
    </Svg>
  );
};

export default Mauer;
