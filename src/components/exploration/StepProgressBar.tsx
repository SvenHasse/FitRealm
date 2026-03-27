import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepProgressBarProps {
  current: number;
  total: number;
}

export default function StepProgressBar({ current, total }: StepProgressBarProps) {
  const pct = total > 0 ? Math.min(current / total, 1) : 0;
  const pctLabel = Math.round(pct * 100);

  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pctLabel}%` }]} />
      </View>
      <Text style={styles.text}>
        {current.toLocaleString('de-DE')} / {total.toLocaleString('de-DE')} Schritte ({pctLabel}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  barBg: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1a2535',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: '#4CAF50',
  },
  text: {
    marginTop: 4,
    fontSize: 12,
    color: '#aab4c2',
    textAlign: 'center',
  },
});
