// BuildMenuSheet.tsx
// FitRealm - Building selection sheet with category tabs + flip cards.

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import {
  AppColors, BuildingType,
  gameStateRathausLevel, workerStatus, WorkerStatus,
} from '../models/types';
import { allowedInstances } from '../config/GameConfigHelpers';
import BuildingCard from './game/BuildingCard';

type TabKey = 'production' | 'infrastructure' | 'special';

const categoryMap: Record<TabKey, BuildingType[]> = {
  production:     [BuildingType.proteinfarm, BuildingType.holzfaeller, BuildingType.steinbruch, BuildingType.feld],
  infrastructure: [BuildingType.holzlager, BuildingType.steinlager, BuildingType.nahrungslager, BuildingType.kaserne, BuildingType.stall, BuildingType.wachturm, BuildingType.mauer],
  special:        [BuildingType.tempel, BuildingType.bibliothek, BuildingType.marktplatz, BuildingType.stammeshaus],
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
    { key: 'production',     label: t('buildMenu.production') },
    { key: 'infrastructure', label: t('buildMenu.infrastructure') },
    { key: 'special',        label: t('buildMenu.special') },
  ];

  const rathausLevel = gameStateRathausLevel(gameState);

  // 3-state worker availability
  const hasIdleWorker = gameState.workers.some(w => {
    const st = workerStatus(w);
    return st === WorkerStatus.idle || (st === WorkerStatus.active && !w.assignedBuildingID);
  });
  const hasAnyWorker = gameState.workers.length > 0;

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
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Building Grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        {categoryMap[selectedTab].map(type => {
          const existing = gameState.buildings.filter(b => b.type === type).length;
          const allowed  = allowedInstances(type, rathausLevel);

          return (
            <BuildingCard
              key={type}
              type={type}
              gameState={gameState}
              rathausLevel={rathausLevel}
              existing={existing}
              allowed={allowed}
              onBuild={() => onSelectBuilding(type)}
              hasIdleWorker={hasIdleWorker}
              hasAnyWorker={hasAnyWorker}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#1A1C2A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 12,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10,
  },
  tabActive: { backgroundColor: AppColors.gold },
  tabText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  tabTextActive: { color: '#000', fontWeight: 'bold' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 16, gap: 12,
  },
});
