// BuildingCardBack.tsx
// Back face of the flip building card — compact details only.

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BuildingType, buildingDisplayName, buildingDescription } from '../../models/types';
import { formatDuration } from '../../utils/formatDuration';
import type { CardStatus, CostLine } from './BuildingCard';

interface Props {
  type: BuildingType;
  costLines: CostLine[];
  status: CardStatus;
  rathausLevel: number;
  rathausReq: number;
  existing: number;
  totalMax: number;
  buildTimeSecs: number;
  nextSlotLevel: number | null;
  onFlip: () => void;
}

function BuildingCardBack({
  type, status, rathausLevel, rathausReq,
  existing, totalMax, buildTimeSecs, nextSlotLevel, onFlip,
}: Props) {
  const { t } = useTranslation();
  const slotLocked = status === 'slotLocked';

  return (
    <View style={styles.card}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onFlip}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={14} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {buildingDisplayName(type)}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.divider} />

      {/* Info rows */}
      <View style={styles.rows}>
        {buildTimeSecs > 0 && (
          <Row
            iconName="clock-outline" iconColor="#9E9E9E"
            label={t('buildCard.buildTimeLabel')}
            value={formatDuration(buildTimeSecs)}
          />
        )}
        {buildTimeSecs > 0 && (
          <Row
            iconName="account-hard-hat" iconColor="#4CAF50"
            label={t('buildCard.withWorkerLabel')}
            value={formatDuration(Math.floor(buildTimeSecs / 2))}
          />
        )}
        <Row
          iconName="castle" iconColor="#F5A623"
          label={t('buildings.rathaus')}
          value={t('buildCard.rathausNeeded', { level: rathausReq })}
          valueHighlight={rathausLevel < rathausReq}
        />
        <Row
          iconName="counter" iconColor="#607D8B"
          label={t('buildCard.builtMax')}
          value={`${existing} / ${totalMax}`}
        />
        {slotLocked && nextSlotLevel !== null && (
          <Row
            iconName="lock-open-outline" iconColor="#F5A623"
            label={t('buildCard.nextSlot')}
            value={t('buildMenu.rathausRequired', { level: nextSlotLevel })}
          />
        )}
      </View>

      <View style={styles.divider} />

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {buildingDescription(type)}
      </Text>
    </View>
  );
}

function Row({
  iconName, iconColor, label, value, valueHighlight = false,
}: {
  iconName: string; iconColor: string; label: string; value: string; valueHighlight?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <MaterialCommunityIcons name={iconName as any} size={13} color={iconColor} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueHighlight && rowStyles.valueWarn]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontSize: 11, color: '#606880', flex: 1 },
  value: { fontSize: 11, color: '#d0d4e0', fontWeight: '600' },
  valueWarn: { color: '#ef5350' },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1A1D2C',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 11,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 26, height: 26,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 13, fontWeight: '700', color: '#d0d4e0',
    textAlign: 'center', marginHorizontal: 4,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  rows: { gap: 7 },
  description: {
    flex: 1,
    fontSize: 10,
    color: '#4A4F68',
    fontStyle: 'italic',
    lineHeight: 15,
  },
});

export default memo(BuildingCardBack);
