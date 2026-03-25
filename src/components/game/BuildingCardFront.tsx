// BuildingCardFront.tsx
// Front face of the flip building card.

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
  hasAnyWorker: boolean;
  onFlip: () => void;
  onBuild: () => void;
}

function BuildingCardFront({
  type, status, costLines, benefitLines, rathausReq, iconName, iconColor,
  buildTimeSecs, hasIdleWorker, hasAnyWorker, onFlip, onBuild,
}: Props) {
  const canBuild      = status === 'canBuild';
  const rathausLocked = status === 'rathausLocked';
  const atMax         = status === 'atMax';
  const tooExpensive  = status === 'tooExpensive';
  const slotLocked    = status === 'slotLocked';
  const dimmed        = rathausLocked || atMax || slotLocked;

  const cardBorderColor =
    canBuild     ? `${iconColor}66` :
    tooExpensive ? 'rgba(239,83,80,0.35)' :
                   'rgba(255,255,255,0.07)';

  // Build button
  let btnLabel    = '🔨 Bauen';
  let btnDisabled = false;
  let btnOpacity  = 1.0;
  if (tooExpensive)  { btnLabel = '❌ Zu teuer';       btnDisabled = true; btnOpacity = 0.4; }
  if (rathausLocked) { btnLabel = '🔒 Gesperrt';       btnDisabled = true; btnOpacity = 0.3; }
  if (atMax)         { btnLabel = '✓ Max erreicht';    btnDisabled = true; btnOpacity = 0.4; }
  if (slotLocked)    { btnLabel = '🔒 Slot gesperrt';  btnDisabled = true; btnOpacity = 0.4; }

  return (
    <View style={[styles.card, { borderColor: cardBorderColor }]}>

      {/* Row 1: info button (ℹ) + icon */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.infoBtn} onPress={onFlip} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.infoBtnText}>ℹ</Text>
        </TouchableOpacity>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={26}
            color={dimmed ? 'rgba(255,255,255,0.25)' : iconColor}
          />
        </View>
      </View>

      {/* Building name */}
      <Text style={[styles.name, dimmed && { opacity: 0.4 }]} numberOfLines={1}>
        {buildingDisplayName(type)}
      </Text>

      {/* Costs box + Benefits box side by side */}
      <View style={styles.boxRow}>

        {/* Costs */}
        <View style={[
          styles.box, styles.costsBox,
          tooExpensive && { borderColor: 'rgba(239,83,80,0.4)' },
          dimmed && { opacity: 0.45 },
        ]}>
          {rathausLocked ? (
            <Text style={styles.rathausHint}>🏛️ L{rathausReq}</Text>
          ) : costLines.length === 0 ? (
            <Text style={styles.mutedText}>—</Text>
          ) : (
            costLines.map((line, i) => (
              <View key={i} style={styles.costLineRow}>
                <Text style={styles.lineEmoji}>{line.emoji}</Text>
                <Text
                  style={[styles.costValue, !line.ok && styles.costRed]}
                  numberOfLines={1}
                >
                  {line.text}
                </Text>
                {!line.ok && (
                  <Text style={styles.costHave} numberOfLines={1}> /{line.have}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Benefits */}
        <View style={[styles.box, styles.benefitsBox, dimmed && { opacity: 0.4 }]}>
          {benefitLines.map((line, i) => (
            <View key={i} style={styles.benefitLineRow}>
              <Text style={styles.lineEmoji}>{line.emoji}</Text>
              <Text style={styles.benefitValue} numberOfLines={1}>{line.text}</Text>
            </View>
          ))}
          {buildTimeSecs > 0 && (
            <View style={styles.benefitLineRow}>
              <Text style={styles.lineEmoji}>⏱</Text>
              <Text style={[styles.benefitValue, { color: '#808898' }]} numberOfLines={1}>
                {formatDuration(buildTimeSecs)}
                {hasIdleWorker ? ` → ${formatDuration(Math.floor(buildTimeSecs / 2))}` : ''}
              </Text>
            </View>
          )}
          {buildTimeSecs > 0 && !hasAnyWorker && (
            <Text style={styles.noWorkerHint} numberOfLines={1}>Keine Worker</Text>
          )}
          {buildTimeSecs > 0 && hasAnyWorker && !hasIdleWorker && (
            <Text style={styles.busyWorkerHint} numberOfLines={1}>Worker beschäftigt</Text>
          )}
        </View>
      </View>

      {/* Build button */}
      <TouchableOpacity
        style={[styles.buildBtn, { opacity: btnOpacity }]}
        onPress={onBuild}
        disabled={btnDisabled}
        activeOpacity={0.75}
      >
        <Text style={styles.buildBtnText}>{btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1C1F2E',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    gap: 7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBtn: {
    width: 24, height: 24,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  name: {
    fontSize: 13, fontWeight: '700', color: '#d0d4e0',
  },
  boxRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  box: {
    flex: 1,
    borderRadius: 8, borderWidth: 1,
    padding: 6,
    gap: 3,
  },
  costsBox: {
    backgroundColor: 'rgba(239,83,80,0.06)',
    borderColor: 'rgba(239,83,80,0.18)',
  },
  benefitsBox: {
    backgroundColor: 'rgba(76,175,80,0.06)',
    borderColor: 'rgba(76,175,80,0.18)',
  },
  costLineRow:    { flexDirection: 'row', alignItems: 'center' },
  benefitLineRow: { flexDirection: 'row', alignItems: 'center' },
  lineEmoji:    { fontSize: 10, marginRight: 2 },
  costValue:    { fontSize: 10, color: '#d0d4e0', flex: 1 },
  costRed:      { color: '#ef5350' },
  costHave:     { fontSize: 9, color: '#606880' },
  benefitValue: { fontSize: 10, color: '#b0c4b0', flex: 1 },
  rathausHint:  { fontSize: 11, color: '#F5A623', fontWeight: '600' },
  mutedText:    { fontSize: 10, color: '#606880' },
  noWorkerHint:   { fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  busyWorkerHint: { fontSize: 8, color: 'rgba(245,166,35,0.6)', marginTop: 2 },
  buildBtn: {
    backgroundColor: '#3D2C1E',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#F5A623',
    paddingVertical: 8,
    alignItems: 'center',
  },
  buildBtnText: { fontSize: 11, fontWeight: '700', color: '#F5A623' },
});

export default memo(BuildingCardFront);
