// ProgressProjectionWidget.tsx
// Shows 3 "next reward" goals. The steps goal is dynamic; the other two are hardcoded.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GameIcon from './GameIcon';
import { AppColors } from '../models/types';

interface GoalItem {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
  showCheck?: boolean;
}

function buildGoals(stepsToday: number, stepsGoal: number): GoalItem[] {
  const stepsLeft = Math.max(stepsGoal - stepsToday, 0);
  return [
    {
      icon: 'walk',
      color: '#4CAF50',
      text:
        stepsLeft > 0
          ? `Noch ${stepsLeft.toLocaleString('de-DE')} Schritte → +7,5g Muskelmasse`
          : 'Schrittziel erreicht! +7,5g Muskelmasse verdient',
      showCheck: stepsLeft === 0,
    },
    {
      icon: 'time',
      color: AppColors.teal,
      text: 'Noch 23 Min Workout → genug für Rathaus L3-Upgrade',
    },
    {
      icon: 'heart',
      color: '#F44336',
      text: 'Noch 15 Min bei 70%+ HRmax → +1 Protein',
    },
  ];
}

interface Props {
  stepsToday?: number;
  stepsGoal?: number;
}

export default function ProgressProjectionWidget({ stepsToday = 0, stepsGoal = 10000 }: Props) {
  const goals = buildGoals(stepsToday, stepsGoal);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="navigate" size={15} color={AppColors.gold} />
        <Text style={styles.title}>Nächste Belohnungen</Text>
      </View>

      {goals.map((goal, i) => (
        <View
          key={i}
          style={[styles.goalRow, i === 0 && styles.goalRowHighlight]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${goal.color}22` }]}>
            <Ionicons name={goal.icon} size={16} color={goal.color} />
          </View>
          {goal.showCheck ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <GameIcon name="check" size={13} />
              <Text style={[styles.goalText, i === 0 && styles.goalTextPrimary]}>
                {goal.text}
              </Text>
            </View>
          ) : (
            <Text style={[styles.goalText, i === 0 && styles.goalTextPrimary]}>
              {goal.text}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  title: { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  goalRowHighlight: {
    backgroundColor: `${AppColors.gold}14`,
    borderWidth: 1,
    borderColor: `${AppColors.gold}28`,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  goalTextPrimary: { color: AppColors.textPrimary },
});
