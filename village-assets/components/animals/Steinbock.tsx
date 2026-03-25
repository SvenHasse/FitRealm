import React from 'react';
import Svg, { Polygon, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { size?: number; }

export const Steinbock: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Left horn — curved sweep */}
    <Path d="M11,10 Q6,4 10,1 Q13,3 11,10" fill="#D7CCC8"/>
    {/* Right horn */}
    <Path d="M19,10 Q24,4 20,1 Q17,3 19,10" fill="#D7CCC8"/>
    {/* Body */}
    <Ellipse cx="15" cy="20" rx="8" ry="6" fill="#78909C"/>
    {/* Head */}
    <Circle cx="15" cy="12" r="5" fill="#78909C"/>
    {/* Snout */}
    <Ellipse cx="15" cy="14.5" rx="2.5" ry="1.8" fill="#90A4AE"/>
    {/* Left eye */}
    <Circle cx="13" cy="11.5" r="1" fill="#212121"/>
    <Circle cx="13.3" cy="11.2" r="0.3" fill="#fff"/>
    {/* Right eye */}
    <Circle cx="17" cy="11.5" r="1" fill="#212121"/>
    <Circle cx="17.3" cy="11.2" r="0.3" fill="#fff"/>
    {/* Beard */}
    <Path d="M13.5,16 Q15,18 16.5,16" stroke="#D7CCC8" strokeWidth="1.5" fill="none"/>
    {/* Front legs */}
    <Path d="M11,25 L10,30" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M14,26 L13,30" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Back legs */}
    <Path d="M17,26 L18,30" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M20,25 L21,30" stroke="#78909C" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Tail */}
    <Polygon points="22,18 26,16 24,22" fill="#90A4AE"/>
  </Svg>
);

export default Steinbock;
