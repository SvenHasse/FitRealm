import React from 'react';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { size?: number; }

export const MystischerHirsch: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Left antler base */}
    <Path d="M11,10 L8,2" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M9,6 L5,4" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8,4 L6,1" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Right antler base */}
    <Path d="M19,10 L22,2" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round"/>
    <Path d="M21,6 L25,4" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M22,4 L24,1" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Glow overlay on antlers */}
    <Path d="M11,10 L8,2" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round"/>
    <Path d="M9,6 L5,4" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
    <Path d="M8,4 L6,1" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
    <Path d="M19,10 L22,2" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round"/>
    <Path d="M21,6 L25,4" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
    <Path d="M22,4 L24,1" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
    {/* Body */}
    <Ellipse cx="15" cy="21" rx="8" ry="6" fill="#6D4C41"/>
    {/* Neck */}
    <Ellipse cx="14" cy="15" rx="3" ry="4" fill="#6D4C41"/>
    {/* Head */}
    <Circle cx="15" cy="11" r="4.5" fill="#6D4C41"/>
    {/* Snout */}
    <Ellipse cx="15" cy="13" rx="2.2" ry="1.5" fill="#8D6E63"/>
    {/* Left eye — glowing */}
    <Circle cx="13" cy="10" r="1.2" fill="#B0BEC5"/>
    <Circle cx="13" cy="10" r="0.6" fill="#212121"/>
    <Circle cx="13.3" cy="9.7" r="0.3" fill="#fff"/>
    {/* Right eye — glowing */}
    <Circle cx="17" cy="10" r="1.2" fill="#B0BEC5"/>
    <Circle cx="17" cy="10" r="0.6" fill="#212121"/>
    <Circle cx="17.3" cy="9.7" r="0.3" fill="#fff"/>
    {/* Front legs */}
    <Path d="M11,26 L10,30" stroke="#6D4C41" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M14,27 L13,30" stroke="#6D4C41" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Back legs */}
    <Path d="M17,27 L18,30" stroke="#6D4C41" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M20,26 L21,30" stroke="#6D4C41" strokeWidth="2.5" strokeLinecap="round"/>
    {/* White belly spot */}
    <Ellipse cx="15" cy="22" rx="4" ry="2.5" fill="#8D6E63" opacity={0.6}/>
    {/* Tail */}
    <Ellipse cx="23" cy="19" rx="2" ry="3" fill="#ECEFF1"/>
  </Svg>
);

export default MystischerHirsch;
