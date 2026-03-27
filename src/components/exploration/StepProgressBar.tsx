import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  current: number;
  total: number;
}

export function StepProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min(current / total, 1) : 0;
  return (
    <View style={{ marginVertical: 12 }}>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: '#4CAF50', borderRadius: 5 }} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        {current.toLocaleString()} / {total.toLocaleString()} Schritte ({Math.round(pct * 100)}%)
      </Text>
    </View>
  );
}
