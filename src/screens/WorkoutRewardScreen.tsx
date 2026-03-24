// WorkoutRewardScreen.tsx – placeholder until the full reward flow is built.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../models/types';

interface Props {
  onClose?: () => void;
}

export default function WorkoutRewardScreen({ onClose }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="trophy" size={64} color={AppColors.gold} style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Workout-Auswertung</Text>
      <Text style={styles.sub}>Hier kommt bald die detaillierte Auswertung{'\n'}mit Ressourcen-Belohnungen.</Text>
      {onClose && (
        <TouchableOpacity style={styles.btn} onPress={onClose}>
          <Text style={styles.btnText}>Schließen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: AppColors.textPrimary, marginBottom: 12 },
  sub: { fontSize: 15, color: AppColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: AppColors.gold,
    borderRadius: 14,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
