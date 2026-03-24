// workoutIcons.ts
// Maps workout type strings to @expo/vector-icons (MaterialCommunityIcons).
// Used everywhere an emoji previously showed a "?".

export interface WorkoutIconInfo {
  library: 'MaterialCommunityIcons' | 'Ionicons';
  name: string;
  color: string;
}

export function getWorkoutIcon(workoutType: string): WorkoutIconInfo {
  const t = (workoutType ?? '').toLowerCase();

  if (t.includes('lauf') || t.includes('run') || t.includes('joggen') || t.includes('jog'))
    return { library: 'MaterialCommunityIcons', name: 'run-fast', color: '#FF6B35' };

  if (t.includes('rad') || t.includes('cycl') || t.includes('bike'))
    return { library: 'MaterialCommunityIcons', name: 'bike', color: '#00BCD4' };

  if (t.includes('kraft') || t.includes('strength') || t.includes('gym') || t.includes('gewicht') || t.includes('barbell'))
    return { library: 'MaterialCommunityIcons', name: 'dumbbell', color: '#F5A623' };

  if (t.includes('hiit') || t.includes('intervall') || t.includes('flash'))
    return { library: 'MaterialCommunityIcons', name: 'lightning-bolt', color: '#E91E63' };

  if (t.includes('schwimm') || t.includes('swim'))
    return { library: 'MaterialCommunityIcons', name: 'swim', color: '#2196F3' };

  if (t.includes('yoga') || t.includes('stretch') || t.includes('meditation') || t.includes('pilates'))
    return { library: 'MaterialCommunityIcons', name: 'yoga', color: '#9C27B0' };

  if (t.includes('wander') || t.includes('hike') || t.includes('hiking') || t.includes('trail'))
    return { library: 'MaterialCommunityIcons', name: 'hiking', color: '#4CAF50' };

  if (t.includes('fußball') || t.includes('soccer') || t.includes('football'))
    return { library: 'MaterialCommunityIcons', name: 'soccer', color: '#4CAF50' };

  if (t.includes('basketball'))
    return { library: 'MaterialCommunityIcons', name: 'basketball', color: '#FF9800' };

  if (t.includes('tennis'))
    return { library: 'MaterialCommunityIcons', name: 'tennis', color: '#8BC34A' };

  if (t.includes('spazier') || t.includes('walk'))
    return { library: 'MaterialCommunityIcons', name: 'walk', color: '#00BCD4' };

  if (t.includes('ruder') || t.includes('row'))
    return { library: 'MaterialCommunityIcons', name: 'rowing', color: '#00BCD4' };

  if (t.includes('ellip'))
    return { library: 'MaterialCommunityIcons', name: 'run', color: '#9C27B0' };

  if (t.includes('functional') || t.includes('cross'))
    return { library: 'MaterialCommunityIcons', name: 'weight-lifter', color: '#F5A623' };

  // Default
  return { library: 'MaterialCommunityIcons', name: 'heart-pulse', color: '#F5A623' };
}
