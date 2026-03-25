import React from 'react';
import type { BuildingType } from '../../src/models/types';
import { Stall } from './buildings/Stall';

interface Props {
  type: BuildingType | string;
  level?: 1 | 2 | 3 | 4 | 5;
  size?: number;
}

export function BuildingRenderer({ type, level = 1, size = 120 }: Props): React.ReactElement | null {
  const lvl = (Math.max(1, Math.min(5, level)) as 1 | 2 | 3 | 4 | 5);
  switch (type) {
    case 'stall': return <Stall level={lvl} size={size} />;
    default:      return null;
  }
}

export default BuildingRenderer;
