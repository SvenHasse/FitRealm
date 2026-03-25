import React from 'react';
import type { AnimalType } from '../../src/models/types';
import { Erntehuhn } from './animals/Erntehuhn';
import { Lastesel } from './animals/Lastesel';
import { Holzbaer } from './animals/Holzbaer';

interface Props {
  type: AnimalType;
  size?: number;
}

export function AnimalRenderer({ type, size = 24 }: Props): React.ReactElement | null {
  switch (type) {
    case 'erntehuhn': return <Erntehuhn size={size} />;
    case 'lastesel':  return <Lastesel  size={size} />;
    case 'holzbaer':  return <Holzbaer  size={size} />;
    default:          return null;
  }
}

export default AnimalRenderer;
