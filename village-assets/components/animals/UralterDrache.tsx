import React from 'react';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { size?: number; }

export const UralterDrache: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Left wing */}
    <Path d="M10,14 Q2,8 3,2 Q8,6 12,14" fill="#2E7D32"/>
    <Path d="M10,16 Q1,12 2,6 Q7,11 10,16" fill="#1B5E20"/>
    {/* Right wing */}
    <Path d="M20,14 Q28,8 27,2 Q22,6 18,14" fill="#2E7D32"/>
    <Path d="M20,16 Q29,12 28,6 Q23,11 20,16" fill="#1B5E20"/>
    {/* Tail */}
    <Path d="M22,20 Q28,22 29,28 Q25,24 20,24" fill="#1B5E20"/>
    <Polygon points="27,27 30,25 28,30" fill="#2E7D32"/>
    {/* Body */}
    <Ellipse cx="15" cy="20" rx="8" ry="6" fill="#1B5E20"/>
    {/* Belly scales */}
    <Ellipse cx="15" cy="21" rx="5" ry="4" fill="#2E7D32"/>
    {/* Neck */}
    <Ellipse cx="14" cy="14" rx="4" ry="4" fill="#1B5E20"/>
    {/* Head */}
    <Ellipse cx="13" cy="9" rx="6" ry="5" fill="#1B5E20"/>
    {/* Head horns */}
    <Polygon points="9,5 7,1 11,5" fill="#2E7D32"/>
    <Polygon points="14,4 13,0 17,4" fill="#2E7D32"/>
    {/* Snout */}
    <Ellipse cx="9" cy="10" rx="4" ry="3" fill="#2E7D32"/>
    {/* Nostril */}
    <Circle cx="7.5" cy="10" r="0.8" fill="#1B5E20"/>
    <Circle cx="10" cy="10" r="0.8" fill="#1B5E20"/>
    {/* Left eye */}
    <Circle cx="11" cy="7" r="1.5" fill="#FFD600"/>
    <Circle cx="11" cy="7" r="0.7" fill="#212121"/>
    <Circle cx="11.4" cy="6.6" r="0.3" fill="#fff"/>
    {/* Right eye */}
    <Circle cx="15.5" cy="7" r="1.5" fill="#FFD600"/>
    <Circle cx="15.5" cy="7" r="0.7" fill="#212121"/>
    <Circle cx="15.9" cy="6.6" r="0.3" fill="#fff"/>
    {/* Fire breath */}
    <Polygon points="5,10 0,8 2,14" fill="#FF6D00"/>
    <Polygon points="4,11 0,10 1,15" fill="#FFD600" opacity={0.8}/>
    {/* Claws */}
    <Path d="M9,25 L7,30" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M13,26 L12,30" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M17,26 L18,30" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M21,25 L23,29" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round"/>
  </Svg>
);

export default UralterDrache;
