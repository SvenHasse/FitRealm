// WorkoutIcon.tsx
// Renders a MaterialCommunityIcons icon for a given workout type string.

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getWorkoutIcon } from '../utils/workoutIcons';

interface Props {
  workoutType: string;
  size?: number;
  colorOverride?: string;
}

export default function WorkoutIcon({ workoutType, size = 24, colorOverride }: Props) {
  const icon = getWorkoutIcon(workoutType);
  return (
    <MaterialCommunityIcons
      name={icon.name as any}
      size={size}
      color={colorOverride ?? icon.color}
    />
  );
}
