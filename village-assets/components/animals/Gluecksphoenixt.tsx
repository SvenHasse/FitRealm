import React from 'react';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { size?: number; }

export const Gluecksphoenixt: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Flame tail — bottom */}
    <Polygon points="10,28 15,22 20,28" fill="#FFD600"/>
    <Polygon points="8,30 13,23 17,29" fill="#D50000"/>
    <Polygon points="14,30 16,23 22,29" fill="#FF6D00"/>
    <Polygon points="12,30 15,24 18,30" fill="#FFD600" opacity={0.8}/>
    {/* Left wing */}
    <Path d="M11,14 Q3,10 2,4 Q7,7 11,14" fill="#FF6D00"/>
    <Path d="M11,16 Q2,14 1,8 Q6,12 11,16" fill="#D50000"/>
    {/* Right wing */}
    <Path d="M19,14 Q27,10 28,4 Q23,7 19,14" fill="#FF6D00"/>
    <Path d="M19,16 Q28,14 29,8 Q24,12 19,16" fill="#D50000"/>
    {/* Body */}
    <Ellipse cx="15" cy="16" rx="6" ry="7" fill="#FF6D00"/>
    {/* Body highlight */}
    <Ellipse cx="15" cy="16" rx="3.5" ry="5" fill="#FF8F00"/>
    {/* Head */}
    <Circle cx="15" cy="8" r="5" fill="#FF6D00"/>
    {/* Head crest */}
    <Polygon points="13,4 15,0 17,4" fill="#FFD600"/>
    <Polygon points="15,4 17,1 19,5" fill="#FF8F00"/>
    {/* Beak */}
    <Polygon points="13,9 15,12 17,9" fill="#FFD600"/>
    {/* Left eye */}
    <Circle cx="13" cy="7" r="1.2" fill="#FFD600"/>
    <Circle cx="13" cy="7" r="0.6" fill="#212121"/>
    <Circle cx="13.3" cy="6.7" r="0.3" fill="#fff"/>
    {/* Right eye */}
    <Circle cx="17" cy="7" r="1.2" fill="#FFD600"/>
    <Circle cx="17" cy="7" r="0.6" fill="#212121"/>
    <Circle cx="17.3" cy="6.7" r="0.3" fill="#fff"/>
  </Svg>
);

export default Gluecksphoenixt;
