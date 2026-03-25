// BuildMenuSheet.tsx
// FitRealm - Building selection sheet with category tabs + i18n

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import {
  AppColors, BuildingType,
  buildingIconName, buildingAccentColor,
  gameStateRathausLevel,
} from '../models/types';
import { buildCost, rathausRequirement, allowedInstances, nextInstanceUnlockLevel, maxInstances, getTotalStorageCap, getStorageBonusArray, storageBuildingResource, Production } from '../config/GameConfig';
import { canAfford, costString, hourlyProductionRate } from '../engines/GameEngine';

type TabKey = 'production' | 'infrastructure' | 'special';

const categoryMap: Record<TabKey, BuildingType[]> = {
  production: [BuildingType.kornkammer, BuildingType.proteinfarm, BuildingType.holzfaeller, BuildingType.steinbruch, BuildingType.feld],
  infrastructure: [BuildingType.holzlager, BuildingType.steinlager, BuildingType.nahrungslager, BuildingType.kaserne],
  special: [BuildingType.tempel, BuildingType.bibliothek, BuildingType.marktplatz, BuildingType.stammeshaus],
};

interface Props {
  onSelectBuilding: (type: BuildingType) => void;
  onClose: () => void;
}

// Production rate at L1 for a given building type
function l1ProductionRate(type: BuildingType): { rate: number; resource: string } | null {
  const mockBuilding = { type, level: 1, currentStorage: 0, assignedWorkerID: null, isDecayed: false, id: '', position: { row: 0, col: 0 } };
  const rate = hourlyProductionRate(mockBuilding as any);
  if (rate <= 0) return null;
  const resourceMap: Partial<Record<BuildingType, string>> = {
    [BuildingType.kornkammer]:  'g Muskel/h',
    [BuildingType.proteinfarm]: ' Protein/h',
    [BuildingType.holzfaeller]: ' Holz/h',
    [BuildingType.steinbruch]:  ' Stein/h',
    [BuildingType.feld]:        ' Nahrung/h',
  };
  const suffix = resourceMap[type];
  if (!suffix) return null;
  return { rate, resource: suffix };
}

export default function BuildMenuSheet({ onSelectBuilding, onClose }: Props) {
  const [selectedTab, setSelectedTab] = useState<TabKey>('production');
  const store = useGameStore();
  const { gameState } = store;
  const { t } = useTranslation();
  const currentCap = getTotalStorageCap(gameState.buildings);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'production', label: t('buildMenu.production') },
    { key: 'infrastructure', label: t('buildMenu.infrastructure') },
    { key: 'special', label: t('buildMenu.special') },
  ];

  const filteredTypes = categoryMap[selectedTab] || [];

  return (
    <View style={styles.sheet}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: AppColors.gold, fontWeight: '600' }}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('buildMenu.title')}</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Building Grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        {filteredTypes.map(type => {
          const cost         = buildCost(type);
          const rathausLevel = gameStateRathausLevel(gameState);
          const existing     = gameState.buildings.filter(b => b.type === type).length;
          const allowed      = allowedInstances(type, rathausLevel);
          const totalMax     = maxInstances(type);
          const nextUnlock   = nextInstanceUnlockLevel(type, existing);
          const nextAlloc    = nextInstanceUnlockLevel(type, allowed); // next slot level (for partial hint)

          // Determine state
          const notUnlocked  = allowed === 0;               // Case 1: not yet available at all
          const atMax        = existing >= totalMax;         // Case 3: fully maxed
          const slotLocked   = !notUnlocked && !atMax        // Case 2: has slots but next one locked
                             && existing >= allowed && nextUnlock !== null;
          const canPlace     = !notUnlocked && !atMax && existing < allowed
                             && canAfford(gameState, cost);  // Case 4: can build

          // Badge content
          const showBadge    = totalMax > 1 && existing > 0;
          const badgeLabel   = atMax
            ? t('buildMenu.instanceCount', { current: existing, max: totalMax })
            : t('buildMenu.instanceCount', { current: existing, max: totalMax });

          // Primary lock label
          const lockLabel = notUnlocked
            ? t('buildMenu.unlocksAtRathaus', { level: rathausRequirement(type) })
            : atMax
              ? t('buildMenu.maxReached')
              : !canAfford(gameState, cost) && existing < allowed
                ? t('buildMenu.tooExpensive')
                : null;

          return (
            <TouchableOpacity
              key={type}
              style={[styles.buildCard, canPlace && styles.buildCardActive]}
              onPress={() => canPlace && onSelectBuilding(type)}
              activeOpacity={canPlace ? 0.7 : 1}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={buildingIconName(type) as any}
                  size={36}
                  color={canPlace ? buildingAccentColor(type) : 'rgba(255,255,255,0.3)'}
                />
                {/* Badge: shows current/total when partially or fully used */}
                {showBadge && (
                  <View style={[styles.countBadge, atMax && styles.countBadgeMax]}>
                    <Text style={styles.countBadgeText}>{badgeLabel}</Text>
                  </View>
                )}
                {/* Lock icon for fully locked buildings */}
                {notUnlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={{ fontSize: 14 }}>🔒</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.buildName, (notUnlocked || atMax) && { opacity: 0.4 }]}>
                {t(`buildings.${type}`)}
              </Text>

              {/* Primary status line */}
              {lockLabel ? (
                <Text style={styles.lockReason}>{lockLabel}</Text>
              ) : (
                <Text style={styles.costText}>{costString(cost)}</Text>
              )}

              {/* Case 2: next slot hint */}
              {slotLocked && nextAlloc !== null && (
                <Text style={styles.nextSlotHint}>
                  {t('buildMenu.nextSlotAt', { level: nextAlloc })}
                </Text>
              )}

              {/* Storage capacity bonus preview */}
              {storageBuildingResource(type) !== null && canPlace && (() => {
                const bonusArr = getStorageBonusArray(type);
                const res = storageBuildingResource(type)!;
                if (!bonusArr) return null;
                const l1Bonus = bonusArr[0];
                const curCap = currentCap[res as keyof typeof currentCap] as number;
                const newCap = curCap + l1Bonus;
                const emoji = type === BuildingType.holzlager ? '🪵'
                            : type === BuildingType.steinlager ? '🪨' : '🌾';
                const resName = res === 'wood' ? 'Holz' : res === 'stone' ? 'Stein' : 'Nahrung';
                return (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoRowText}>{emoji} +{l1Bonus} {resName} Kapazität</Text>
                    <Text style={styles.infoRowSub}>{resName}: {Math.floor(curCap)} → {Math.floor(newCap)}</Text>
                  </View>
                );
              })()}

              {/* Production rate at L1 */}
              {[BuildingType.holzfaeller, BuildingType.steinbruch, BuildingType.feld,
                BuildingType.proteinfarm, BuildingType.kornkammer].includes(type) && canPlace && (() => {
                const info = l1ProductionRate(type);
                if (!info) return null;
                return (
                  <Text style={styles.infoRowText}>
                    ⚡ {info.rate % 1 === 0 ? info.rate : info.rate.toFixed(1)}{info.resource}
                  </Text>
                );
              })()}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#1E1E3A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 12,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 },
  tabActive: { backgroundColor: AppColors.gold },
  tabText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#000', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  buildCard: {
    width: '47%', backgroundColor: '#252547', borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  buildCardActive: { borderColor: `${AppColors.gold}80`, borderWidth: 1.5 },
  buildName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  lockReason: { fontSize: 10, fontWeight: '500', color: 'rgba(244,67,54,0.8)' },
  costText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  countBadge: {
    position: 'absolute', top: -4, right: -10,
    backgroundColor: AppColors.gold, borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  countBadgeMax: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  lockOverlay: {
    position: 'absolute', bottom: -2, right: -8,
  },
  nextSlotHint: {
    fontSize: 9, fontWeight: '500', color: '#F5A623',
    textAlign: 'center', marginTop: 2,
  },
  infoRow: { alignItems: 'center', gap: 2 },
  infoRowText: { fontSize: 9, color: '#4DD0E1', textAlign: 'center' },
  infoRowSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
