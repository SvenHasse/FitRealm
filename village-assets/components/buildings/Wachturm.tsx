import React from 'react';
import Svg, { Polygon, Rect, Circle, G } from 'react-native-svg';

interface WachtturmProps {
  level: number;
  size?: number;
}

export const Wachturm: React.FC<WachtturmProps> = ({ level, size = 120 }) => {
  const visualLevel = level >= 5 ? 5 : level >= 3 ? 3 : 1;

  if (visualLevel === 1) {
    // Schlanker Holzturm
    return (
      <Svg width={size} height={size * 1.125} viewBox="0 0 80 90">
        {/* Grasplattform */}
        <Polygon points="40,74 72,86 40,90 8,86" fill="#4A7C3F"/>
        <Polygon points="8,83 40,87 40,90 8,86" fill="#3A6432"/>
        <Polygon points="40,87 72,83 72,86 40,90" fill="#2E5228"/>
        {/* Turmschaft links */}
        <Polygon points="30,72 40,76 40,86 30,82" fill="#A08B6E"/>
        {/* Turmschaft rechts */}
        <Polygon points="40,76 50,72 50,82 40,86" fill="#8B7355"/>
        {/* Plattform oben links */}
        <Polygon points="26,60 40,65 40,76 26,71" fill="#A08B6E"/>
        {/* Plattform oben rechts */}
        <Polygon points="40,65 54,60 54,71 40,76" fill="#8B7355"/>
        {/* Plattform-Dach */}
        <Polygon points="24,60 40,55 40,65 24,60" fill="#C4934A"/>
        <Polygon points="40,55 56,60 40,65" fill="#A87840"/>
        {/* Brüstung (kleine Balken) */}
        <Rect x="25" y="58" width="3" height="5" fill="#8B7355"/>
        <Rect x="31" y="57" width="3" height="5" fill="#8B7355"/>
        <Rect x="37" y="57" width="3" height="5" fill="#8B7355"/>
        <Rect x="43" y="57" width="3" height="5" fill="#8B7355"/>
        <Rect x="49" y="58" width="3" height="5" fill="#8B7355"/>
        {/* Fackel */}
        <Rect x="39" y="48" width="2" height="6" fill="#8B7355"/>
        <Circle cx="40" cy="46" r="3" fill="#FF8C00" opacity="0.9"/>
        <Circle cx="40" cy="46" r="1.8" fill="#FFD54F"/>
      </Svg>
    );
  }

  if (visualLevel === 3) {
    // Steinturm mit Zinnen und Flagge
    return (
      <Svg width={size} height={size * 1.125} viewBox="0 0 80 90">
        {/* Grasplattform */}
        <Polygon points="40,74 72,86 40,90 8,86" fill="#4A7C3F"/>
        <Polygon points="8,83 40,87 40,90 8,86" fill="#3A6432"/>
        <Polygon points="40,87 72,83 72,86 40,90" fill="#2E5228"/>
        {/* Turmschaft links */}
        <Polygon points="28,70 40,75 40,86 28,81" fill="#B0A090"/>
        {/* Turmschaft rechts */}
        <Polygon points="40,75 52,70 52,81 40,86" fill="#9E8E70"/>
        {/* Oberer Turm links */}
        <Polygon points="24,54 40,60 40,75 24,70" fill="#B0A090"/>
        {/* Oberer Turm rechts */}
        <Polygon points="40,60 56,54 56,70 40,75" fill="#9E8E70"/>
        {/* Bogenschlitz links */}
        <Rect x="27" y="62" width="5" height="7" fill="#1A1A2E" opacity="0.7"/>
        {/* Bogenschlitz rechts */}
        <Rect x="48" y="60" width="5" height="7" fill="#1A1A2E" opacity="0.7"/>
        {/* Zinnen (abwechselnd hoch/tief) */}
        <Rect x="24" y="50" width="5" height="6" fill="#B0A090"/>
        <Rect x="31" y="52" width="4" height="4" fill="#9E8E70"/>
        <Rect x="37" y="50" width="5" height="6" fill="#B0A090"/>
        <Rect x="44" y="52" width="4" height="4" fill="#9E8E70"/>
        <Rect x="50" y="50" width="5" height="6" fill="#B0A090"/>
        {/* Flaggenstock */}
        <Rect x="39" y="36" width="2" height="16" fill="#8B7355"/>
        {/* Flagge */}
        <Polygon points="41,36 53,40 41,44" fill="#E53935"/>
      </Svg>
    );
  }

  // Level 5 — Imposanter Turm mit Leuchtfeuer
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90">
      {/* Grasplattform */}
      <Polygon points="40,74 76,87 40,91 4,87" fill="#4A7C3F"/>
      <Polygon points="4,84 40,88 40,91 4,87" fill="#3A6432"/>
      <Polygon points="40,88 76,84 76,87 40,91" fill="#2E5228"/>
      {/* Breite Steinbasis links */}
      <Polygon points="22,70 40,76 40,86 22,80" fill="#B0A090"/>
      {/* Breite Steinbasis rechts */}
      <Polygon points="40,76 58,70 58,80 40,86" fill="#9E8E70"/>
      {/* Mittlerer Turm links */}
      <Polygon points="26,56 40,62 40,76 26,70" fill="#B0A090"/>
      {/* Mittlerer Turm rechts */}
      <Polygon points="40,62 54,56 54,70 40,76" fill="#9E8E70"/>
      {/* Oberer Turm links */}
      <Polygon points="28,44 40,50 40,62 28,56" fill="#B0A090"/>
      {/* Oberer Turm rechts */}
      <Polygon points="40,50 52,44 52,56 40,62" fill="#9E8E70"/>
      {/* Bogenschlitze */}
      <Rect x="30" y="56" width="4" height="8" fill="#1A1A2E" opacity="0.7"/>
      <Rect x="46" y="54" width="4" height="8" fill="#1A1A2E" opacity="0.7"/>
      {/* Banner links */}
      <Rect x="21" y="66" width="3" height="10" fill="#9E8E70"/>
      <Polygon points="21,66 27,68 21,70" fill="#E53935"/>
      {/* Banner rechts */}
      <Rect x="56" y="64" width="3" height="10" fill="#9E8E70"/>
      <Polygon points="59,64 53,66 59,68" fill="#E53935"/>
      {/* Zinnen */}
      <Rect x="27" y="40" width="4" height="6" fill="#B0A090"/>
      <Rect x="33" y="42" width="4" height="4" fill="#9E8E70"/>
      <Rect x="39" y="40" width="4" height="6" fill="#B0A090"/>
      <Rect x="45" y="42" width="4" height="4" fill="#9E8E70"/>
      <Rect x="51" y="40" width="4" height="6" fill="#B0A090"/>
      {/* Leuchtfeuer-Sockel */}
      <Rect x="37" y="30" width="6" height="10" fill="#9E8E70"/>
      {/* Leuchtfeuer Glühen */}
      <Circle cx="40" cy="27" r="7" fill="#FF6D00" opacity="0.35"/>
      {/* Leuchtfeuer Kern */}
      <Circle cx="40" cy="27" r="4" fill="#FFD600"/>
      <Circle cx="40" cy="27" r="2" fill="#FFFFFF" opacity="0.9"/>
    </Svg>
  );
};

export default Wachturm;
