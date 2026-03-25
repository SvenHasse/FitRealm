import React from 'react';
import type { AnimalType } from '../../src/models/types';
import { Erntehuhn } from './animals/Erntehuhn';
import { Lastesel } from './animals/Lastesel';
import { Holzbaer } from './animals/Holzbaer';
import { Spaehfalke } from './animals/Spaehfalke';
import { Steinbock } from './animals/Steinbock';
import { MystischerHirsch } from './animals/MystischerHirsch';
import { Kriegswolf } from './animals/Kriegswolf';
import { Gluecksphoenixt } from './animals/Gluecksphoenixt';
import { UralterDrache } from './animals/UralterDrache';

interface Props {
  type: AnimalType;
  size?: number;
}

export function AnimalRenderer({ type, size = 24 }: Props): React.ReactElement | null {
  switch (type) {
    case 'erntehuhn':       return <Erntehuhn       size={size} />;
    case 'lastesel':        return <Lastesel         size={size} />;
    case 'holzbaer':        return <Holzbaer         size={size} />;
    case 'spaehfalke':      return <Spaehfalke       size={size} />;
    case 'steinbock':       return <Steinbock        size={size} />;
    case 'mystischerHirsch':return <MystischerHirsch size={size} />;
    case 'kriegswolf':      return <Kriegswolf       size={size} />;
    case 'gluecksphoenixt': return <Gluecksphoenixt  size={size} />;
    case 'uralterDrache':   return <UralterDrache    size={size} />;
    default:                return null;
  }
}

export default AnimalRenderer;
