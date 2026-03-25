import React from 'react';
import Svg, { Polygon, Circle, Line, Ellipse, Rect } from 'react-native-svg';

interface Props { size?: number; }

export const Lastesel: React.FC<Props> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 30 30">
    {/* Body */}
    <Polygon points="6,17 24,13 25,22 7,26" fill="#9E9E9E"/>
    {/* Neck */}
    <Polygon points="6,17 3,11 8,9 11,14" fill="#9E9E9E"/>
    {/* Head */}
    <Polygon points="2,11 6,7 11,10 7,14" fill="#BDBDBD"/>
    {/* Ears */}
    <Polygon points="4,7 2,2 7,6" fill="#9E9E9E"/>
    <Polygon points="5,7 3,3 7,6" fill="#BDBDBD"/>
    {/* Snout */}
    <Ellipse cx="2" cy="12" rx="3" ry="2" fill="#BDBDBD"/>
    <Circle cx="1" cy="12" r="0.8" fill="#757575"/>
    <Circle cx="3" cy="12" r="0.8" fill="#757575"/>
    {/* Eye */}
    <Circle cx="5" cy="9" r="1.2" fill="#424242"/>
    <Circle cx="5.4" cy="8.6" r="0.4" fill="#fff" opacity="0.6"/>
    {/* Mane */}
    <Line x1="6" y1="9" x2="10" y2="13" stroke="#757575" strokeWidth="1.2"/>
    {/* Saddle bags */}
    <Rect x="10" y="18" width="8" height="6" rx="1" fill="#795548"/>
    <Rect x="15" y="19" width="6" height="5" rx="1" fill="#6D4C41"/>
    {/* Legs */}
    <Line x1="10" y1="25" x2="9" y2="30" stroke="#757575" strokeWidth="2"/>
    <Line x1="14" y1="26" x2="13" y2="30" stroke="#757575" strokeWidth="2"/>
    <Line x1="18" y1="25" x2="19" y2="30" stroke="#757575" strokeWidth="2"/>
    <Line x1="22" y1="24" x2="23" y2="29" stroke="#757575" strokeWidth="2"/>
    {/* Tail */}
    <Line x1="25" y1="16" x2="28" y2="14" stroke="#757575" strokeWidth="1.5"/>
    <Line x1="28" y1="14" x2="27" y2="11" stroke="#9E9E9E" strokeWidth="1"/>
  </Svg>
);

export default Lastesel;
