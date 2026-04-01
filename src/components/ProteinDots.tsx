// ProteinDots.tsx
// Renders 0–3 diamond icons representing earned protein.

import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  earned: number;   // 0–3
  size?: number;
  gap?: number;
}

export default function ProteinDots({ earned, size = 20, gap = 6 }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3].map(i => (
        <MaterialCommunityIcons
          key={i}
          name="diamond-stone"
          size={size}
          color={i <= earned ? (earned === 3 ? '#E8A838' : '#4A90D9') : '#3A4A3C'}
        />
      ))}
    </View>
  );
}
