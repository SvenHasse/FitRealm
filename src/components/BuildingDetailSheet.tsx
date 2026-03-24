// BuildingDetailSheet.tsx
// FitRealm - Building detail modal with new bottom sheet styling + i18n

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import {
  AppColors, Building, BuildingType, buildingIconName, buildingAccentColor,
  buildingProducesResource, ResourceType,
  findBuildingById, workerStatus, WorkerStatus,
} from '../models/types';
import { upgradeCost, getTotalStorageCap, LAGER_BONUS_PER_LEVEL } from '../config/GameConfig';
import { costString, canAfford, hourlyProductionRate, buildingStorageCap, SellConsequences } from '../engines/GameEngine';
import SellConfirmModal from './SellConfirmModal';

interface Props {
  buildingID: string;
  onClose: () => void;
}

export default function BuildingDetailSheet({ buildingID, onClose }: Props) {
  const store = useGameStore();
  const { t } = useTranslation();
  const building = findBuildingById(store.gameState, buildingID);
  const [soldMessage, setSoldMessage] = useState<string | null>(null);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellConsequences, setSellConsequences] = useState<SellConsequences | null>(null);

  if (!building) {
    return (
      <View style={styles.sheet}>
        <Text style={{ color: AppColors.textSecondary, textAlign: 'center', padding: 20 }}>{t('buildingDetail.notFound')}</Text>
      </View>
    );
  }

  const accent = buildingAccentColor(building.type);
  const rate = hourlyProductionRate(building);
  const cap = buildingStorageCap(building, store.gameState.buildings);
  const levelColors: Record<number, string> = { 1: '#9E9E9E', 2: '#66BB6A', 3: '#42A5F5', 4: '#AB47BC', 5: '#FFD54F' };

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 16, paddingTop: 4 }}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('buildingDetail.title')}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: AppColors.gold, fontWeight: '600' }}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <Ionicons name={buildingIconName(building.type) as any} size={64} color={building.isDecayed ? '#666' : accent} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Text style={styles.heroName}>{t(`buildings.${building.type}`)}</Text>
          <View style={[styles.badge, { backgroundColor: levelColors[building.level] || '#9E9E9E' }]}>
            <Text style={styles.badgeText}>L{building.level}</Text>
          </View>
        </View>
        <Text style={styles.heroDesc}>{t(`buildings.${building.type}Desc`)}</Text>

        {rate > 0 && (
          <>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
              <InfoChip icon="time" value={rateLabel(building, rate)} label={t('buildingDetail.perHour')} color={accent} />
              <InfoChip icon="archive" value={`${Math.floor(building.currentStorage)}/${Math.floor(cap)}`} label={t('buildingDetail.storage')} color={AppColors.gold} />
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${Math.min((cap > 0 ? building.currentStorage / cap : 0) * 100, 100)}%`,
                backgroundColor: (building.currentStorage / cap) >= 0.9 ? '#4CAF50' : accent,
              }]} />
            </View>
          </>
        )}
      </View>

      {/* Lager bonus section */}
      {building.type === BuildingType.lager && (
        <LagerBonusSection building={building} />
      )}

      {/* Collect */}
      {building.currentStorage > 0 && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t('buildingDetail.available')}</Text>
              <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#4CAF50' }}>{collectLabel(building, t)}</Text>
            </View>
            <TouchableOpacity style={styles.goldBtn} onPress={() => store.collectResources(building.id)}>
              <Ionicons name="download" size={14} color="#000" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>{t('buildingDetail.collect')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Upgrade */}
      <UpgradeSection building={building} />

      {/* Worker */}
      <WorkerSection building={building} />

      {/* Decay banner */}
      {building.isDecayed && (
        <View style={styles.decayBanner}>
          <Ionicons name="warning" size={16} color="#FF9800" />
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#FF9800', flex: 1 }}>{t('buildingDetail.decayWarning')}</Text>
        </View>
      )}

      {/* Sold success banner */}
      {soldMessage && (
        <View style={styles.soldBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.soldBannerText}>{soldMessage}</Text>
        </View>
      )}

      {/* Sell button — hidden for Rathaus */}
      {building.type !== BuildingType.rathaus && !soldMessage && (
        <TouchableOpacity
          style={styles.sellBtn}
          onPress={() => {
            const consequences = store.calculateSellConsequences(building.id);
            setSellConsequences(consequences);
            setSellModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          <Text style={styles.sellBtnText}>{t('building.sell')}</Text>
        </TouchableOpacity>
      )}

      {/* Total storage capacity footer */}
      <TotalCapFooter buildings={store.gameState.buildings} />

      <View style={{ height: 20 }} />

      <SellConfirmModal
        visible={sellModalVisible}
        buildingName={t(`buildings.${building.type}`)}
        consequences={sellConsequences}
        onCancel={() => setSellModalVisible(false)}
        onConfirm={() => {
          setSellModalVisible(false);
          const refund = store.sellBuilding(building.id);
          if (refund) {
            setSoldMessage(`${t('building.sell')}! ${costString(refund)}`);
            setTimeout(onClose, 1400);
          }
        }}
      />
    </ScrollView>
  );
}

function InfoChip({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: `${color}1F`, borderRadius: 10 }}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginTop: 3 }}>{value}</Text>
      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{label}</Text>
    </View>
  );
}

function UpgradeSection({ building }: { building: Building }) {
  const store = useGameStore();
  const { t } = useTranslation();
  const cost = building.level < 5 ? upgradeCost(building.type, building.level) : null;
  const canUpg = cost ? canAfford(store.gameState, cost) : false;

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="arrow-up-circle" size={18} color={AppColors.gold} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{t('buildingDetail.upgrade')}</Text>
      </View>
      {building.level >= 5 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Ionicons name="checkmark-circle" size={16} color={AppColors.gold} />
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{t('buildingDetail.maxLevel')}</Text>
        </View>
      ) : cost ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{t('buildingDetail.levelUpgrade', { from: building.level, to: building.level + 1 })}</Text>
            <Text style={{ fontSize: 11, color: canUpg ? 'rgba(255,255,255,0.5)' : 'rgba(244,67,54,0.7)', marginTop: 2 }}>{costString(cost)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: canUpg ? AppColors.gold : 'rgba(255,255,255,0.1)' }]}
            onPress={() => store.upgradeBuilding(building.id)}
            disabled={!canUpg}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: canUpg ? '#000' : '#888' }}>{t('buildingDetail.upgradeButton')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function WorkerSection({ building }: { building: Building }) {
  const store = useGameStore();
  const { t } = useTranslation();
  const assigned = building.assignedWorkerID
    ? store.gameState.workers.find(w => w.id === building.assignedWorkerID)
    : null;
  const idle = store.gameState.workers.filter(w =>
    workerStatus(w) === WorkerStatus.idle || (workerStatus(w) === WorkerStatus.active && !w.assignedBuildingID)
  );

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="person" size={18} color="#00BCD4" />
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{t('buildingDetail.worker')}</Text>
      </View>
      {assigned ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{assigned.name}</Text>
            <Text style={{ fontSize: 11, color: '#4CAF50' }}>{t('workerSheet.levelLabel', { level: assigned.level })} · {t('buildingDetail.active')}</Text>
          </View>
          <TouchableOpacity
            style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(244,67,54,0.1)', borderRadius: 8 }}
            onPress={() => store.unassignWorker(assigned.id)}
          >
            <Text style={{ fontSize: 12, color: 'rgba(244,67,54,0.8)' }}>{t('buildingDetail.dismiss')}</Text>
          </TouchableOpacity>
        </View>
      ) : idle.length === 0 ? (
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{t('buildingDetail.noWorker')}</Text>
      ) : (
        idle.map(w => (
          <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(26,26,46,0.5)', borderRadius: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 13, color: '#fff', flex: 1 }}>{w.name}</Text>
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#00BCD4', borderRadius: 8 }}
              onPress={() => store.assignWorker(w.id, building.id)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#000' }}>{t('buildingDetail.assign')}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}


// MARK: - Lager Bonus Section
function LagerBonusSection({ building }: { building: Building }) {
  const store = useGameStore();
  const { t } = useTranslation();
  const lvIdx = Math.min(building.level - 1, LAGER_BONUS_PER_LEVEL.length - 1);
  const bonus = LAGER_BONUS_PER_LEVEL[lvIdx];
  const totalCap = getTotalStorageCap(store.gameState.buildings);

  // Next level bonus (if not max)
  const nextIdx = building.level < LAGER_BONUS_PER_LEVEL.length ? building.level : null;
  const nextBonus = nextIdx !== null ? LAGER_BONUS_PER_LEVEL[nextIdx] : null;

  const rows: { label: string; bonusVal: number; total: number }[] = [
    { label: t('resources.muskelmasse'), bonusVal: bonus.muskelmasse, total: totalCap.muskelmasse },
    { label: t('resources.wood'),        bonusVal: bonus.wood,        total: totalCap.wood },
    { label: t('resources.food'),        bonusVal: bonus.food,        total: totalCap.food },
    { label: t('resources.stone'),       bonusVal: bonus.stone,       total: totalCap.stone },
    { label: t('resources.protein'),     bonusVal: bonus.protein,     total: totalCap.protein },
  ];

  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: 'rgba(77,208,225,0.25)' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontSize: 16 }}>📦</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#4DD0E1' }}>{t('storage.lagerbonusTitle')}</Text>
      </View>
      {rows.map(row => (
        <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{row.label}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#4DD0E1' }}>
            +{Math.floor(row.bonusVal)}{row.label === t('resources.muskelmasse') ? 'g' : ''}
          </Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
            {t('storage.total', { value: Math.floor(row.total) + (row.label === t('resources.muskelmasse') ? 'g' : '') })}
          </Text>
        </View>
      ))}
      {nextBonus && (
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          {t('storage.nextLevel')}: +{Math.floor(nextBonus.muskelmasse)}g · +{Math.floor(nextBonus.wood)} {t('resources.wood')}
        </Text>
      )}
    </View>
  );
}

// MARK: - Total Cap Footer
function TotalCapFooter({ buildings }: { buildings: Building[] }) {
  const { t } = useTranslation();
  const cap = getTotalStorageCap(buildings);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 8, opacity: 0.6 }}>
      <Text style={{ fontSize: 11 }}>💾</Text>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
        {t('storage.totalCap')}: {Math.floor(cap.muskelmasse)}g · {Math.floor(cap.wood)} {t('resources.wood')} · {Math.floor(cap.food)} {t('resources.food')}
      </Text>
    </View>
  );
}

function rateLabel(building: Building, rate: number): string {
  return buildingProducesResource(building.type) === ResourceType.muskelmasse
    ? `${rate.toFixed(1)}g` : `${Math.round(rate)}`;
}

function collectLabel(building: Building, t: (key: string, opts?: any) => string): string {
  const amt = Math.floor(building.currentStorage);
  switch (buildingProducesResource(building.type)) {
    case ResourceType.muskelmasse: return t('buildingDetail.muskelmasse', { amount: amt });
    case ResourceType.protein: return t('buildingDetail.protein', { amount: amt });
    case ResourceType.wood: return t('buildingDetail.wood', { amount: amt });
    case ResourceType.stone: return t('buildingDetail.stone', { amount: amt });
    case ResourceType.food: return t('buildingDetail.food', { amount: amt });
    default: return `${amt}`;
  }
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#1E1E3A' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  heroCard: {
    backgroundColor: '#252547', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 12,
  },
  heroName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
  progressBg: { height: 6, backgroundColor: '#1E1E3A', borderRadius: 3, overflow: 'hidden', marginTop: 12, width: '80%' },
  progressFill: { height: 6, borderRadius: 3 },
  card: { backgroundColor: '#252547', borderRadius: 16, padding: 16, marginBottom: 12 },
  goldBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: AppColors.gold, borderRadius: 10,
  },
  upgradeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  decayBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, backgroundColor: 'rgba(255,152,0,0.12)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,152,0,0.3)',
    marginBottom: 12,
  },
  sellBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, marginBottom: 12,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(255,80,80,0.45)', borderRadius: 14,
  },
  sellBtnText: { fontSize: 15, fontWeight: '600', color: '#FF6B6B' },
  soldBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, backgroundColor: 'rgba(76,175,80,0.12)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)',
    marginBottom: 12,
  },
  soldBannerText: { fontSize: 13, fontWeight: '600', color: '#4CAF50', flex: 1 },
});
