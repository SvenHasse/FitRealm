// BuildingCardBack.tsx
// Back face of the flip building card — shows full details.

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  type, costLines, status, rathausLevel, rathausReq,
  existing, totalMax, buildTimeSecs, nextSlotLevel, onFlip,
}: Props) {
  const tooExpensive  = status === 'tooExpensive';
  const slotLocked    = status === 'slotLocked';
  const missingLines  = costLines.filter(l => !l.ok);

  return (
    <View style={styles.card}>

      {/* Top row: close button + title */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={onFlip} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {buildingDisplayName(type)}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.divider} />

      {/* Missing resources warning */}
      {tooExpensive && missingLines.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Fehlt:</Text>
          {missingLines.map((l, i) => (
            <Text key={i} style={styles.warningLine}>
              {l.emoji} noch {l.missing} (Hast: {l.have})
            </Text>
          ))}
        </View>
      )}

      {/* Slot locked hint */}
      {slotLocked && nextSlotLevel !== null && (
        <View style={styles.slotBox}>
          <Text style={styles.slotText}>🏛️ Nächster Slot ab Rathaus L{nextSlotLevel}</Text>
        </View>
      )}

      {/* Info rows */}
      <View style={styles.infoSection}>
        <InfoRow label="⏱ Bauzeit"    value={buildTimeSecs > 0 ? formatDuration(buildTimeSecs) : '—'} />
        <InfoRow label="👷 Mit Worker" value={buildTimeSecs > 0 ? formatDuration(Math.floor(buildTimeSecs / 2)) : '—'} />
        <InfoRow label="🏛️ Rathaus"   value={`L${rathausReq} nötig (Du: L${rathausLevel})`} />
        <InfoRow label="📊 Vorhanden" value={`${existing} / ${totalMax}`} />
      </View>

      <View style={styles.divider} />

      {/* Description */}
      <Text style={styles.description} numberOfLines={4}>
        {buildingDescription(type)}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1C1F2E',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 10,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 24, height: 24,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  title: {
    flex: 1,
    fontSize: 13, fontWeight: '700', color: '#d0d4e0',
    textAlign: 'center', marginHorizontal: 4,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  warningBox: {
    backgroundColor: 'rgba(239,83,80,0.09)',
    borderRadius: 7, borderWidth: 1, borderColor: 'rgba(239,83,80,0.28)',
    padding: 6, gap: 2,
  },
  warningTitle: { fontSize: 10, fontWeight: '700', color: '#ef5350' },
  warningLine:  { fontSize: 9, color: '#ef9090' },
  slotBox: {
    backgroundColor: 'rgba(245,166,35,0.09)',
    borderRadius: 7, borderWidth: 1, borderColor: 'rgba(245,166,35,0.25)',
    padding: 6,
  },
  slotText: { fontSize: 10, color: '#F5A623', fontWeight: '600', textAlign: 'center' },
  infoSection: { gap: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 10, color: '#606880' },
  infoValue: { fontSize: 10, color: '#d0d4e0', fontWeight: '500', flex: 1, textAlign: 'right' },
  description: {
    flex: 1,
    fontSize: 9.5,
    color: '#505870',
    fontStyle: 'italic',
    lineHeight: 14,
  },
});

export default memo(BuildingCardBack);
