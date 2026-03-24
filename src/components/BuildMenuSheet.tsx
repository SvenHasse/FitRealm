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
import { buildCost, rathausRequirement, maxInstances } from '../config/GameConfig';
import { canAfford, costString } from '../engines/GameEngine';

type TabKey = 'production' | 'infrastructure' | 'special';

const categoryMap: Record<TabKey, BuildingType[]> = {
  production: [BuildingType.kornkammer, BuildingType.proteinfarm, BuildingType.holzfaeller, BuildingType.steinbruch, BuildingType.feld],
  infrastructure: [BuildingType.lager, BuildingType.kaserne],
  special: [BuildingType.tempel, BuildingType.bibliothek, BuildingType.marktplatz, BuildingType.stammeshaus],
};

interface Props {
  onSelectBuilding: (type: BuildingType) => void;
  onClose: () => void;
}

export default function BuildMenuSheet({ onSelectBuilding, onClose }: Props) {
  const [selectedTab, setSelectedTab] = useState<TabKey>('production');
  const store = useGameStore();
  const { gameState } = store;
  const { t } = useTranslation();

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
          const cost = buildCost(type);
          const reqLevel = rathausRequirement(type);
          const max = maxInstances(type);
          const existingCount = gameState.buildings.filter(b => b.type === type).length;
          const meetsReq = gameStateRathausLevel(gameState) >= reqLevel;
          const affordable = canAfford(gameState, cost);
          const atMax = existingCount >= max;
          const canPlace = meetsReq && affordable && !atMax;
          const lockReason = atMax ? t('buildMenu.maxReached')
            : !meetsReq ? t('buildMenu.rathausRequired', { level: reqLevel })
            : !affordable ? t('buildMenu.tooExpensive') : null;
          // Show "1/2" badge when multi-build is partially used
          const showCount = max > 1 && existingCount > 0 && !atMax;

          return (
            <TouchableOpacity
              key={type}
              style={[styles.buildCard, canPlace && styles.buildCardActive]}
              onPress={() => canPlace && onSelectBuilding(type)}
              activeOpacity={canPlace ? 0.7 : 1}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons name={buildingIconName(type) as any} size={36} color={canPlace ? buildingAccentColor(type) : 'rgba(255,255,255,0.3)'} />
                {showCount && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{t('buildMenu.instanceCount', { current: existingCount, max })}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.buildName, !canPlace && { opacity: 0.4 }]}>{t(`buildings.${type}`)}</Text>
              {lockReason ? (
                <Text style={styles.lockReason}>{lockReason}</Text>
              ) : (
                <Text style={styles.costText}>{costString(cost)}</Text>
              )}
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
  countBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#000' },
});
