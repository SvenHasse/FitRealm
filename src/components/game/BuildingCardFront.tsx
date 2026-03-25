// BuildingCardFront.tsx
// Front face of the flip building card — single-column, clean layout.

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuildingType, buildingDisplayName } from '../../models/types';
import { formatDuration } from '../../utils/formatDuration';
import type { CardStatus, CostLine, BenefitLine } from './BuildingCard';

interface Props {
  type: BuildingType;
  status: CardStatus;
  costLines: CostLine[];
  benefitLines: BenefitLine[];
  rathausReq: number;
  iconName: string;
  iconColor: string;
  buildTimeSecs: number;
  hasIdleWorker: boolean;
  onFlip: () => void;
  onBuild: () => void;
}

function BuildingCardFront({
  type, status, costLines, benefitLines, rathausReq, iconName, iconColor,
  buildTimeSecs, hasIdleWorker, onFlip, onBuild,
}: Props) {
  const canBuild      = status === 'canBuild';
  const rathausLocked = status === 'rathausLocked';
  const atMax         = status === 'atMax';
  const tooExpensive  = status === 'tooExpensive';
  const slotLocked    = status === 'slotLocked';
  const dimmed        = rathausLocked || atMax || slotLocked;

  const cardBorder =
    canBuild     ? `${iconColor}66` :
    tooExpensive ? 'rgba(239,83,80,0.4)' :
                   'rgba(255,255,255,0.07)';

  // Button
  let btnLabel    = 'Bauen';
  let btnDisabled = false;
  let btnOpacity  = 1.0;
  let btnIcon: string = 'hammer';
  if (tooExpensive)  { btnLabel = 'Zu teuer';      btnIcon = 'close-circle-outline'; btnDisabled = true; btnOpacity = 0.4; }
  if (rathausLocked) { btnLabel = 'Gesperrt';      btnIcon = 'lock-outline';         btnDisabled = true; btnOpacity = 0.35; }
  if (atMax)         { btnLabel = 'Max erreicht';  btnIcon = 'check-circle-outline'; btnDisabled = true; btnOpacity = 0.4; }
  if (slotLocked)    { btnLabel = 'Slot gesperrt'; btnIcon = 'lock-outline';         btnDisabled = true; btnOpacity = 0.4; }

  return (
    <View style={[styles.card, { borderColor: cardBorder }]}>

      {/* Header: info button (left) + building icon (right) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={onFlip}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="information-outline" size={15} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={28}
            color={dimmed ? 'rgba(255,255,255,0.2)' : iconColor}
          />
        </View>
      </View>

      {/* Building name */}
      <Text style={[styles.name, dimmed && styles.dimmedText]} numberOfLines={1}>
        {buildingDisplayName(type)}
      </Text>

      <View style={styles.divider} />

      {/* Costs / locked state */}
      {rathausLocked ? (
        <View style={styles.lockedRow}>
          <MaterialCommunityIcons name="lock-outline" size={13} color="#F5A623" />
          <Text style={styles.lockedText}> Rathaus L{rathausReq}</Text>
        </View>
      ) : atMax ? (
        <View style={styles.lockedRow}>
          <MaterialCommunityIcons name="check-all" size={13} color="rgba(255,255,255,0.35)" />
          <Text style={[styles.lockedText, { color: 'rgba(255,255,255,0.35)' }]}> Max erreicht</Text>
        </View>
      ) : slotLocked ? (
        <View style={styles.lockedRow}>
          <MaterialCommunityIcons name="lock-outline" size={13} color="#F5A623" />
          <Text style={styles.lockedText}> Slot gesperrt</Text>
        </View>
      ) : costLines.length === 0 ? (
        <Text style={styles.mutedText}>Kostenlos</Text>
      ) : (
        <View style={styles.costsWrap}>
          {costLines.map((line, i) => (
            <View key={i} style={styles.costChip}>
              <MaterialCommunityIcons
                name={line.iconName as any}
                size={12}
                color={line.ok ? line.iconColor : '#ef5350'}
              />
              <Text style={[styles.chipText, !line.ok && styles.chipTextRed]}>
                {line.text}
                {!line.ok ? `(${line.have})` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Main benefit */}
      {!atMax && !slotLocked && !rathausLocked && benefitLines.length > 0 && (
        <View style={styles.benefitRow}>
          <MaterialCommunityIcons name={benefitLines[0].iconName as any} size={13} color={benefitLines[0].iconColor} />
          <Text style={styles.benefitText} numberOfLines={1}> {benefitLines[0].text}</Text>
        </View>
      )}

      {/* Build button */}
      <TouchableOpacity
        style={[styles.btn, { opacity: btnOpacity }]}
        onPress={onBuild}
        disabled={btnDisabled}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name={btnIcon as any} size={13} color="#F5A623" />
        <Text style={styles.btnText}> {btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1A1D2C',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 11,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBtn: {
    width: 26, height: 26,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  name: {
    fontSize: 14, fontWeight: '700', color: '#d0d4e0',
  },
  dimmedText: { opacity: 0.38 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Locked / max state
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
  lockedText: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  mutedText:  { fontSize: 12, color: '#505870' },

  // Cost chips
  costsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  costChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 3,
    gap: 3,
  },
  chipText:    { fontSize: 11, color: '#c0c4d4', fontWeight: '600' },
  chipTextRed: { color: '#ef5350' },

  // Benefit
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.07)',
    borderRadius: 7,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  benefitText: { fontSize: 12, color: '#a0c8a0', fontWeight: '600', flex: 1 },

  // Button
  btn: {
    flexDirection: 'row',
    backgroundColor: '#2C1F0E',
    borderRadius: 10,
    borderWidth: 1.5, borderColor: '#F5A623',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnText: { fontSize: 12, fontWeight: '700', color: '#F5A623' },
});

export default memo(BuildingCardFront);
