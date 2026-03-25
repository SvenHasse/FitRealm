import React from 'react';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { size?: number; }

export const Spaehfalke: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Left wing */}
    <Polygon points="15,14 2,8 5,18" fill="#5D4037"/>
    {/* Right wing */}
    <Polygon points="15,14 28,8 25,18" fill="#5D4037"/>
    {/* Body */}
    <Ellipse cx="15" cy="17" rx="5" ry="6" fill="#5D4037"/>
    {/* Belly */}
    <Ellipse cx="15" cy="18" rx="3" ry="4" fill="#ECEFF1"/>
    {/* Head */}
    <Circle cx="15" cy="10" r="4.5" fill="#5D4037"/>
    {/* Head white patch */}
    <Ellipse cx="15" cy="10" rx="2.5" ry="2" fill="#ECEFF1"/>
    {/* Left eye */}
    <Circle cx="13.2" cy="9.5" r="1" fill="#212121"/>
    <Circle cx="13.5" cy="9.2" r="0.3" fill="#fff"/>
    {/* Right eye */}
    <Circle cx="16.8" cy="9.5" r="1" fill="#212121"/>
    <Circle cx="17.1" cy="9.2" r="0.3" fill="#fff"/>
    {/* Beak */}
    <Polygon points="14,11.5 16,11.5 15,14" fill="#FF8F00"/>
    {/* Tail */}
    <Polygon points="12,22 15,28 18,22" fill="#5D4037"/>
  </Svg>
);

export default Spaehfalke;
