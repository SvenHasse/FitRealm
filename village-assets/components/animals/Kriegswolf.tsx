import React from 'react';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { size?: number; }

export const Kriegswolf: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Body — leaning forward */}
    <Ellipse cx="16" cy="20" rx="9" ry="6" fill="#37474F"/>
    {/* Neck */}
    <Ellipse cx="12" cy="15" rx="4" ry="4" fill="#37474F"/>
    {/* Head — slightly forward */}
    <Circle cx="10" cy="11" r="5.5" fill="#37474F"/>
    {/* Snout */}
    <Ellipse cx="7" cy="12.5" rx="3.5" ry="2.5" fill="#455A64"/>
    {/* Nose */}
    <Ellipse cx="5.5" cy="12" rx="1.2" ry="0.8" fill="#212121"/>
    {/* Left ear */}
    <Polygon points="7,6 5,1 10,5" fill="#37474F"/>
    {/* Right ear */}
    <Polygon points="13,6 15,2 17,6" fill="#37474F"/>
    {/* Left ear inner */}
    <Polygon points="7.5,5.5 6,2.5 9.5,5" fill="#546E7A"/>
    {/* Right ear inner */}
    <Polygon points="13.5,5.5 15,3 16,5.5" fill="#546E7A"/>
    {/* Left eye — yellow */}
    <Circle cx="8.5" cy="10" r="1.5" fill="#FFD600"/>
    <Circle cx="8.5" cy="10" r="0.6" fill="#212121"/>
    <Circle cx="8.8" cy="9.7" r="0.3" fill="#fff"/>
    {/* Right eye — yellow */}
    <Circle cx="12.5" cy="10" r="1.5" fill="#FFD600"/>
    <Circle cx="12.5" cy="10" r="0.6" fill="#212121"/>
    <Circle cx="12.8" cy="9.7" r="0.3" fill="#fff"/>
    {/* Teeth */}
    <Polygon points="5.5,13.5 6.5,15 7.5,13.5" fill="#ECEFF1"/>
    <Polygon points="7.5,14 8.5,15.5 9.5,14" fill="#ECEFF1"/>
    {/* Tail — raised for aggression */}
    <Path d="M25,16 Q30,10 28,6" stroke="#37474F" strokeWidth="3" strokeLinecap="round" fill="none"/>
    {/* Front legs */}
    <Path d="M8,24 L6,29" stroke="#37474F" strokeWidth="3" strokeLinecap="round"/>
    <Path d="M13,26 L12,30" stroke="#37474F" strokeWidth="3" strokeLinecap="round"/>
    {/* Back legs */}
    <Path d="M18,25 L19,30" stroke="#37474F" strokeWidth="3" strokeLinecap="round"/>
    <Path d="M22,23 L24,28" stroke="#37474F" strokeWidth="3" strokeLinecap="round"/>
    {/* Back fur detail */}
    <Polygon points="12,14 15,10 18,14" fill="#455A64"/>
    <Polygon points="15,14 18,10 21,14" fill="#455A64"/>
  </Svg>
);

export default Kriegswolf;
