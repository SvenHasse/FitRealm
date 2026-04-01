// BuildingRegistryModal.tsx
// FitRealm - Building registry popup: shows all placed buildings, tap to locate on map

import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GameIcon, { GameIconName } from './GameIcon';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import {
  Building, BuildingType, AppColors,
  buildingIconName, buildingAccentColor,
} from '../models/types';
import { hourlyProductionRate, buildingStorageCap } from '../engines/GameEngine';

// MARK: - Category definitions
type CategoryDef = {
  key: string;
  emoji?: string;
  iconName?: GameIconName;
  labelKey: string;
  types: BuildingType[];
};

const CATEGORIES: CategoryDef[] = [
  {
    key: 'main',
    iconName: 'building' as GameIconName,
    labelKey: 'registry.categoryMain',
    types: [BuildingType.rathaus, BuildingType.stammeshaus],
  },
  {
    key: 'production',
    emoji: '⚒️',
    labelKey: 'registry.categoryProduction',
    types: [
      BuildingType.holzfaeller, BuildingType.feld,
      BuildingType.steinbruch, BuildingType.proteinfarm,
    ],
  },
  {
    key: 'infrastructure',
    emoji: '🏗️',
    labelKey: 'registry.categoryInfrastructure',
    types: [BuildingType.holzlager, BuildingType.steinlager, BuildingType.nahrungslager, BuildingType.kaserne],
  },
  {
    key: 'special',
    emoji: '✨',
    labelKey: 'registry.categorySpecial',
    types: [BuildingType.tempel, BuildingType.bibliothek, BuildingType.marktplatz],
  },
];

// MARK: - Props
interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectBuilding: (building: Building) => void;
}

// MARK: - Modal Root
export default function BuildingRegistryModal({ visible, onClose, onSelectBuilding }: Props) {
  const { t } = useTranslation();
  const { gameState } = useGameStore();
  const buildings = gameState.buildings;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('registry.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable building list */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {buildings.length === 0 ? (
              <Text style={styles.empty}>{t('registry.empty')}</Text>
            ) : (
              CATEGORIES.map(cat => {
                const catBuildings = buildings
                  .filter(b => cat.types.includes(b.type))
                  .sort((a, b) => cat.types.indexOf(a.type) - cat.types.indexOf(b.type));
                if (catBuildings.length === 0) return null;
                return (
                  <View key={cat.key} style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 2, paddingLeft: 2 }}>
                      {cat.iconName
                        ? <GameIcon name={cat.iconName} size={14} color="rgba(255,255,255,0.40)" />
                        : <Text style={styles.sectionHeader}>{cat.emoji}</Text>
                      }
                      <Text style={styles.sectionHeader}>{t(cat.labelKey)}</Text>
                    </View>
                    {catBuildings.map(building => (
                      <BuildingRow
                        key={building.id}
                        building={building}
                        allBuildings={buildings}
                        onPress={() => onSelectBuilding(building)}
                      />
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// MARK: - Building Row
function BuildingRow({
  building,
  allBuildings,
  onPress,
}: {
  building: Building;
  allBuildings: Building[];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const accent = buildingAccentColor(building.type);
  const icon = buildingIconName(building.type);
  const produces = hourlyProductionRate(building) > 0;
  const cap = buildingStorageCap(building, allBuildings);
  const stored = Math.floor(building.currentStorage);
  const fillPct = cap > 0 ? Math.min(1, building.currentStorage / cap) : 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Icon */}
      <View style={[styles.iconWrap, { borderColor: `${accent}50` }]}>
        <Ionicons name={icon as any} size={32} color={accent} />
      </View>

      {/* Name + level + storage */}
      <View style={styles.rowInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.buildingName}>{t(`buildings.${building.type}`)}</Text>
          {building.isUnderConstruction ? (
            <View style={[styles.levelBadge, { backgroundColor: 'rgba(245,166,35,0.25)', borderWidth: 1, borderColor: 'rgba(245,166,35,0.5)' }]}>
              <Text style={[styles.levelText, { color: '#F5A623' }]}>🏗️ L{building.targetLevel}</Text>
            </View>
          ) : (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                {t('common.levelShort', { level: building.level })}
              </Text>
            </View>
          )}
        </View>
        {!building.isUnderConstruction && produces && (
          <View style={styles.storageWrap}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(fillPct * 100)}%` as any, backgroundColor: accent },
                ]}
              />
            </View>
            <Text style={styles.storageText}>
              {t('registry.storage', { current: stored, max: Math.floor(cap) })}
            </Text>
          </View>
        )}
      </View>

      {/* Navigate indicator */}
      <Ionicons name="locate-outline" size={18} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

// MARK: - Styles
const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#1E1E3A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: SCREEN_H * 0.60,
    maxHeight: SCREEN_H * 0.85,
  },
  dragHandle: {
    width: 40, height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  closeBtn: { color: AppColors.gold, fontWeight: '600', fontSize: 15 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },
  section: { marginBottom: 20 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.9, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 2, paddingLeft: 2,
  },
  empty: {
    fontSize: 14, color: 'rgba(255,255,255,0.38)',
    textAlign: 'center', marginTop: 48,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#252547', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  iconWrap: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  buildingName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  levelText: { fontSize: 11, fontWeight: 'bold', color: 'rgba(255,255,255,0.65)' },
  storageWrap: { gap: 3 },
  progressBg: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  storageText: { fontSize: 10, color: 'rgba(255,255,255,0.42)' },
});
