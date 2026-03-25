import React from 'react';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';

interface Props { size?: number; }

export const Holzbaer: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Body */}
    <Ellipse cx="17" cy="20" rx="11" ry="9" fill="#5D4037"/>
    {/* Head */}
    <Circle cx="10" cy="12" r="7" fill="#5D4037"/>
    {/* Ears */}
    <Circle cx="5" cy="6" r="3.5" fill="#5D4037"/>
    <Circle cx="5" cy="6" r="1.8" fill="#8D6E63"/>
    <Circle cx="14" cy="5" r="3" fill="#5D4037"/>
    <Circle cx="14" cy="5" r="1.5" fill="#8D6E63"/>
    {/* Snout */}
    <Ellipse cx="7" cy="15" rx="4" ry="3" fill="#8D6E63"/>
    <Ellipse cx="7" cy="13.5" rx="1.8" ry="1.5" fill="#4A2E0A"/>
    {/* Eyes */}
    <Circle cx="8" cy="10" r="1.8" fill="#212121"/>
    <Circle cx="8.5" cy="9.5" r="0.6" fill="#fff" opacity="0.7"/>
    {/* Arms */}
    <Ellipse cx="24" cy="20" rx="4" ry="7" fill="#5D4037"/>
    <Ellipse cx="6" cy="23" rx="4" ry="6" fill="#5D4037"/>
    {/* Paws */}
    <Ellipse cx="25" cy="26" rx="3.5" ry="2.5" fill="#4E342E"/>
    <Ellipse cx="6" cy="28" rx="3.5" ry="2.5" fill="#4E342E"/>
    {/* Claw marks */}
    <Line x1="23" y1="27" x2="23" y2="29" stroke="#3E2723" strokeWidth="0.7"/>
    <Line x1="25" y1="27.5" x2="25" y2="29.5" stroke="#3E2723" strokeWidth="0.7"/>
    <Line x1="27" y1="27" x2="27" y2="29" stroke="#3E2723" strokeWidth="0.7"/>
  </Svg>
);

export default Holzbaer;
