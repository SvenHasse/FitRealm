import React from 'react';
import Svg, { Polygon, Circle, Line, Ellipse } from 'react-native-svg';

interface Props { size?: number; }

export const Erntehuhn: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Body */}
    <Ellipse cx="16" cy="19" rx="10" ry="7" fill="#F5F5F5"/>
    {/* Wing shading */}
    <Ellipse cx="18" cy="19" rx="7" ry="5" fill="#E0E0E0"/>
    {/* Head */}
    <Circle cx="8" cy="11" r="6" fill="#F5F5F5"/>
    {/* Comb (red) */}
    <Polygon points="5,5 7,2 9,5" fill="#E53935"/>
    <Polygon points="7,6 9,3 11,6" fill="#E53935"/>
    {/* Beak */}
    <Polygon points="3,11 0,13 3,13" fill="#FF9800"/>
    {/* Eye */}
    <Circle cx="6" cy="10" r="1.2" fill="#212121"/>
    <Circle cx="6.4" cy="9.6" r="0.4" fill="#fff" opacity="0.7"/>
    {/* Tail feathers */}
    <Polygon points="26,14 30,10 28,20" fill="#F0F0F0"/>
    {/* Feet */}
    <Line x1="13" y1="25" x2="11" y2="29" stroke="#FF9800" strokeWidth="1.2"/>
    <Line x1="11" y1="29" x2="8" y2="29" stroke="#FF9800" strokeWidth="1"/>
    <Line x1="11" y1="29" x2="11" y2="30" stroke="#FF9800" strokeWidth="1"/>
    <Line x1="17" y1="25" x2="19" y2="29" stroke="#FF9800" strokeWidth="1.2"/>
    <Line x1="19" y1="29" x2="22" y2="29" stroke="#FF9800" strokeWidth="1"/>
    <Line x1="19" y1="29" x2="19" y2="30" stroke="#FF9800" strokeWidth="1"/>
  </Svg>
);

export default Erntehuhn;
