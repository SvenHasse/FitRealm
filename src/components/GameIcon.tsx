// GameIcon.tsx
// Central icon component — maps semantic game icon names to MaterialCommunityIcons / Ionicons.

import React from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export type GameIconName =
  | 'streak' | 'protein' | 'mm' | 'shield' | 'shield-active'
  | 'stamm' | 'trophy' | 'quest' | 'lock' | 'globe'
  | 'warning' | 'check' | 'close' | 'crown' | 'target'
  | 'timer' | 'sleep' | 'egg' | 'building' | 'medal-gold'
  | 'medal-silver' | 'medal-bronze' | 'chart' | 'send'
  | 'people' | 'person-add';

interface GameIconProps {
  name: GameIconName;
  size?: number;
  color?: string;
  style?: any;
}

const ICON_MAP: Record<GameIconName, { lib: 'MCI' | 'ION'; icon: string; defaultColor: string }> = {
  streak:          { lib: 'MCI', icon: 'fire',               defaultColor: '#FF8C20' },
  protein:         { lib: 'MCI', icon: 'diamond-stone',      defaultColor: '#4A90D9' },
  mm:              { lib: 'MCI', icon: 'arm-flex',           defaultColor: '#7D9B76' },
  shield:          { lib: 'MCI', icon: 'shield-outline',     defaultColor: '#7D9B76' },
  'shield-active': { lib: 'MCI', icon: 'shield-check',       defaultColor: '#7D9B76' },
  stamm:           { lib: 'MCI', icon: 'sword-cross',        defaultColor: '#C8B89A' },
  trophy:          { lib: 'MCI', icon: 'trophy',             defaultColor: '#E8A838' },
  quest:           { lib: 'MCI', icon: 'lightning-bolt',     defaultColor: '#F2C84B' },
  crown:           { lib: 'MCI', icon: 'crown',              defaultColor: '#E8A838' },
  target:          { lib: 'MCI', icon: 'target',             defaultColor: '#7D9B76' },
  egg:             { lib: 'MCI', icon: 'egg-outline',        defaultColor: '#C8B89A' },
  building:        { lib: 'MCI', icon: 'castle',             defaultColor: '#8B7355' },
  chart:           { lib: 'MCI', icon: 'chart-line',         defaultColor: '#7D9B76' },
  lock:            { lib: 'MCI', icon: 'lock',               defaultColor: '#9A9E9B' },
  globe:           { lib: 'MCI', icon: 'earth',              defaultColor: '#4A90D9' },
  warning:         { lib: 'MCI', icon: 'alert',              defaultColor: '#E8A838' },
  check:           { lib: 'ION', icon: 'checkmark-circle',   defaultColor: '#7D9B76' },
  close:           { lib: 'ION', icon: 'close-circle',       defaultColor: '#C0392B' },
  timer:           { lib: 'MCI', icon: 'timer-sand',         defaultColor: '#9A9E9B' },
  sleep:           { lib: 'MCI', icon: 'sleep',              defaultColor: '#9A9E9B' },
  send:            { lib: 'MCI', icon: 'send',               defaultColor: '#7D9B76' },
  people:          { lib: 'MCI', icon: 'account-group',      defaultColor: '#4A90D9' },
  'person-add':    { lib: 'MCI', icon: 'account-plus',       defaultColor: '#7D9B76' },
  'medal-gold':    { lib: 'MCI', icon: 'medal',              defaultColor: '#FFD700' },
  'medal-silver':  { lib: 'MCI', icon: 'medal',              defaultColor: '#C0C0C0' },
  'medal-bronze':  { lib: 'MCI', icon: 'medal',              defaultColor: '#CD7F32' },
};

export default function GameIcon({ name, size = 20, color, style }: GameIconProps) {
  const entry = ICON_MAP[name];
  // Graceful fallback for unknown/legacy names (e.g. old emoji strings in persisted state)
  if (!entry) {
    return <MaterialCommunityIcons name="help-circle-outline" size={size} color={color ?? '#9A9E9B'} style={style} />;
  }
  const { lib, icon, defaultColor } = entry;
  const c = color ?? defaultColor;
  if (lib === 'ION') {
    return <Ionicons name={icon as any} size={size} color={c} style={style} />;
  }
  return <MaterialCommunityIcons name={icon as any} size={size} color={c} style={style} />;
}
