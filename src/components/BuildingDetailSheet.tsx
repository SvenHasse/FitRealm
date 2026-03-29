// BuildingDetailSheet.tsx
// FitRealm - Building detail modal with new bottom sheet styling + i18n

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import {
  AppColors, Building, BuildingType, buildingIconName, buildingAccentColor,
  buildingProducesResource, ResourceType,
  findBuildingById, workerStatus, WorkerStatus,
} from '../models/types';
import { ANIMAL_CONFIGS } from '../config/GameConfig';
import { upgradeCost, getTotalStorageCap, getStorageBonusArray, storageBuildingResource, constructionTime, skipConstructionCost } from '../config/GameConfigHelpers';
import { costString, canAfford, hourlyProductionRate, buildingStorageCap, SellConsequences } from '../engines/GameEngine';
import SellConfirmModal from './SellConfirmModal';
import { formatDuration } from '../utils/formatDuration';

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
        <Ionicons
          name={building.isUnderConstruction ? ('build-outline' as any) : (buildingIconName(building.type) as any)}
          size={64}
          color={building.isUnderConstruction ? AppColors.gold : (building.isDecayed ? '#666' : accent)}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Text style={styles.heroName}>{t(`buildings.${building.type}`)}</Text>
          <View style={[styles.badge, { backgroundColor: building.isUnderConstruction ? AppColors.gold : (levelColors[building.level] || '#9E9E9E') }]}>
            <Text style={[styles.badgeText, building.isUnderConstruction && { color: '#000' }]}>
              {building.isUnderConstruction ? `L${building.targetLevel}` : `L${building.level}`}
            </Text>
          </View>
        </View>
        <Text style={styles.heroDesc}>{t(`buildings.${building.type}Desc`)}</Text>

        {!building.isUnderConstruction && rate > 0 && (
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

      {building.isUnderConstruction ? (
        /* Construction card replaces collect / upgrade / worker sections */
        <ConstructionCard building={building} />
      ) : (
        <>
          {/* Animal section — only for production buildings */}
          {['holzfaeller', 'feld', 'steinbruch', 'proteinfarm', 'kornkammer'].includes(building.type) && (
            <AnimalSection building={building} />
          )}

          {/* Storage bonus section for dedicated storage buildings */}
          {storageBuildingResource(building.type) !== null && (
            <StorageBonusSection building={building} />
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
        </>
      )}

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
      <TotalCapFooter buildings={store.gameState.buildings} gameState={store.gameState} />

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

  // 3-state worker availability for upgrade time hint
  const hasIdleWorker = store.gameState.workers.some(w => {
    const st = workerStatus(w);
    return st === WorkerStatus.idle || (st === WorkerStatus.active && !w.assignedBuildingID);
  });
  const hasAnyWorker = store.gameState.workers.length > 0;

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
            {/* Construction time preview */}
            {(() => {
              const secs = constructionTime(building.type, building.level + 1);
              if (secs <= 0) return null;
              const timeStr = formatDuration(secs);
              const halfStr = formatDuration(Math.floor(secs / 2));
              return (
                <View style={{ marginTop: 4, gap: 2 }}>
                  {/* Base build time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={'time-outline' as any} size={11} color="rgba(255,255,255,0.5)" />
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      {t('construction.buildTime', { time: timeStr })}
                    </Text>
                  </View>
                  {/* Worker hint — always shown, 3 visual states */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <Text style={[
                      { fontSize: 11 },
                      hasIdleWorker
                        ? { color: '#00BCD4' }
                        : hasAnyWorker
                          ? { color: 'rgba(245,166,35,0.7)' }
                          : { color: 'rgba(255,255,255,0.35)' },
                    ]}>
                      👷 {t('construction.withWorker', { time: halfStr })}
                    </Text>
                    {!hasIdleWorker && hasAnyWorker && (
                      <Text style={{ fontSize: 11, color: 'rgba(245,166,35,0.7)' }}>
                        · {t('construction.allWorkersBusy')}
                      </Text>
                    )}
                    {!hasAnyWorker && (
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        · {t('construction.noWorkers')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })()}
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


// MARK: - Animal Section
const RARITY_COLORS: Record<string, string> = {
  common: '#9E9E9E', uncommon: '#4CAF50', rare: '#2196F3', epic: '#9C27B0', legendary: '#FFD700',
};

function AnimalSection({ building }: { building: Building }) {
  const store = useGameStore();
  const { t } = useTranslation();

  const animal = store.gameState.animals.find(
    a => a.assignment.type === 'building' && (a.assignment as any).buildingId === building.id,
  );

  if (!animal) {
    return (
      <View style={[styles.card, { borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(168,85,247,0.05)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 16 }}>🐾</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(168,85,247,0.7)' }}>{t('animalSection.title')}</Text>
        </View>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t('animalSection.none')}</Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', marginTop: 4 }}>{t('animalSection.noneHint')}</Text>
      </View>
    );
  }

  const cfg = ANIMAL_CONFIGS[animal.type];
  const rarityColor = RARITY_COLORS[cfg.rarity] ?? '#9E9E9E';
  const bonusTypeLabel =
    cfg.buildingBonus.bonusType === 'production' ? t('animals.bonusTypeProd') :
    cfg.buildingBonus.bonusType === 'storage'    ? t('animals.bonusTypeStorage') :
    cfg.buildingBonus.bonusType === 'speed'      ? t('animals.bonusTypeSpeed') :
                                                   t('animals.bonusTypeGlobal');

  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(168,85,247,0.06)' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 36 }}>{cfg.emoji}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>{t(cfg.nameKey)}</Text>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: `${rarityColor}25`, borderRadius: 5, borderWidth: 1, borderColor: rarityColor }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: rarityColor }}>
                {t(`animals.rarity${cfg.rarity.charAt(0).toUpperCase() + cfg.rarity.slice(1)}`)}
              </Text>
            </View>
          </View>
          {cfg.buildingBonus.bonusPercent > 0 && (
            <Text style={{ fontSize: 14, color: '#00B4D8', fontWeight: '600', marginTop: 2 }}>
              {t('animalSection.bonus', { pct: cfg.buildingBonus.bonusPercent, bonusType: bonusTypeLabel })}
            </Text>
          )}
          {cfg.flavorTextKey ? (
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', marginTop: 4 }} numberOfLines={2}>
              {t(cfg.flavorTextKey)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// MARK: - Construction Card
function fmtTimeLeft(endsAt: number | null): string | null {
  if (!endsAt) return null;
  const rem = Math.max(0, (endsAt - Date.now()) / 1000);
  if (rem <= 0) return null;
  return formatDuration(Math.floor(rem));
}

function ConstructionCard({ building }: { building: Building }) {
  const store = useGameStore();
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => fmtTimeLeft(building.constructionEndsAt));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(fmtTimeLeft(building.constructionEndsAt)), 1000);
    return () => clearInterval(id);
  }, [building.constructionEndsAt]);

  const totalDuration = constructionTime(building.type, building.targetLevel);
  const elapsed = building.constructionEndsAt
    ? totalDuration - Math.max(0, (building.constructionEndsAt - Date.now()) / 1000)
    : totalDuration;
  const progress = totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 1;

  const conWorker = building.constructionWorkerID
    ? store.gameState.workers.find(w => w.id === building.constructionWorkerID)
    : null;

  const idleWorkers = store.gameState.workers.filter(w => {
    const st = workerStatus(w);
    return st === WorkerStatus.idle || (st === WorkerStatus.active && !w.assignedBuildingID);
  });
  const hasAnyWorkerForConstruction = store.gameState.workers.length > 0;

  const skipCost = skipConstructionCost(building.type, building.targetLevel);
  const canSkip = store.gameState.protein >= skipCost;

  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: 'rgba(245,166,35,0.35)' }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Ionicons name={'construct-outline' as any} size={18} color={AppColors.gold} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: AppColors.gold }}>
          {building.targetLevel === 1 ? t('construction.inProgress') : t('construction.upgrading')}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ height: 8, backgroundColor: '#1E1E3A', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ height: 8, borderRadius: 4, width: `${Math.round(progress * 100)}%` as any, backgroundColor: AppColors.gold }} />
      </View>

      {/* Time remaining */}
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
        {timeLeft ? t('construction.finishedIn', { time: timeLeft }) : t('construction.complete')}
      </Text>

      {/* Worker section — 4 cases */}
      {conWorker ? (
        /* Case B: worker already assigned to this building */
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: 10, backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 10 }}>
          <Ionicons name={'person' as any} size={16} color="#FF9800" />
          <Text style={{ fontSize: 13, color: '#FF9800' }}>{t('construction.workerOnSite', { name: conWorker.name })}</Text>
        </View>
      ) : idleWorkers.length > 0 ? (
        /* Case A: idle worker available — assign button */
        <View style={{ marginBottom: 12 }}>
          {idleWorkers.slice(0, 1).map(w => (
            <TouchableOpacity
              key={w.id}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 10,
                backgroundColor: 'rgba(0,188,212,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,188,212,0.25)' }}
              onPress={() => store.assignWorkerToConstruction(building.id, w.id)}
            >
              <Ionicons name={'person-add-outline' as any} size={16} color="#00BCD4" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: 13, color: '#fff' }}>{w.name}</Text>
              <Text style={{ fontSize: 12, color: '#00BCD4', fontWeight: '600' }}>{t('construction.assignWorker')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : hasAnyWorkerForConstruction ? (
        /* Case C: workers exist but all busy */
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: 10, backgroundColor: 'rgba(245,166,35,0.08)', borderRadius: 10,
          borderWidth: 1, borderColor: 'rgba(245,166,35,0.2)' }}>
          <Ionicons name={'person-outline' as any} size={16} color="rgba(245,166,35,0.6)" />
          <Text style={{ fontSize: 12, color: 'rgba(245,166,35,0.7)', flex: 1 }}>
            {t('construction.allBusyLong')}
          </Text>
        </View>
      ) : (
        /* Case D: no workers at all */
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
          <Ionicons name={'construct-outline' as any} size={16} color="rgba(255,255,255,0.3)" />
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
            {t('construction.buildKaserne')}
          </Text>
        </View>
      )}

      {/* Skip with Protein */}
      <TouchableOpacity
        style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
          canSkip
            ? { borderColor: 'rgba(77,208,225,0.5)', backgroundColor: 'rgba(77,208,225,0.08)' }
            : { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent' },
        ]}
        onPress={() => canSkip && store.skipConstruction(building.id)}
        disabled={!canSkip}
      >
        <Ionicons name={'flash' as any} size={14} color={canSkip ? '#4DD0E1' : '#555'} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: canSkip ? '#4DD0E1' : '#555' }}>
          {canSkip
            ? t('construction.skipWithProtein', { cost: skipCost })
            : t('construction.notEnoughProtein')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// MARK: - Storage Bonus Section (Holzlager / Steinlager / Nahrungslager)
function StorageBonusSection({ building }: { building: Building }) {
  const store = useGameStore();
  const { t } = useTranslation();

  const bonusArr    = getStorageBonusArray(building.type);
  const resource    = storageBuildingResource(building.type);
  if (!bonusArr || !resource) return null;

  const thisBonus   = bonusArr[Math.min(building.level - 1, bonusArr.length - 1)];
  const totalCap    = getTotalStorageCap(store.gameState.buildings);
  const totalForRes = totalCap[resource as keyof typeof totalCap] as number;
  const currentAmt  = store.gameState[resource as keyof typeof store.gameState] as number;
  const fillRatio   = totalForRes > 0 ? Math.min(currentAmt / totalForRes, 1) : 0;

  const nextBonus = building.level < bonusArr.length ? bonusArr[building.level] : null;

  const emoji     = building.type === 'holzlager' ? '🪵'
                  : building.type === 'steinlager' ? '🪨' : '🌾';
  const resLabel  = resource === 'wood'  ? t('resources.wood')
                  : resource === 'stone' ? t('resources.stone')
                  : t('resources.food');

  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: 'rgba(77,208,225,0.25)' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#4DD0E1' }}>{t('storage.thisStorage')}</Text>
      </View>

      {/* Bonus amount */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
        +{Math.floor(thisBonus)} {resLabel} {t('storage.capacity')}
      </Text>

      {/* Total cap with progress bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 }}>
          {t('storage.totalCap')}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
          {Math.floor(currentAmt)} / {Math.floor(totalForRes)}
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#1E1E3A', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <View style={{
          height: 6, borderRadius: 3, width: `${Math.round(fillRatio * 100)}%`,
          backgroundColor: fillRatio >= 1 ? '#EF5350' : fillRatio >= 0.8 ? '#F5A623' : '#4DD0E1',
        }} />
      </View>

      {/* Next level hint */}
      {nextBonus !== null && (
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
          {t('storage.nextLevel', { level: building.level + 1 })}: +{Math.floor(nextBonus)} {resLabel}
        </Text>
      )}
    </View>
  );
}

// MARK: - Total Cap Footer
function TotalCapFooter({ buildings, gameState }: { buildings: Building[]; gameState: any }) {
  const { t } = useTranslation();
  const cap = getTotalStorageCap(buildings);
  const parts: string[] = [];
  if (cap.wood  !== Infinity) parts.push(`${t('resources.wood')}: ${Math.floor(gameState.wood)}/${Math.floor(cap.wood)}`);
  if (cap.stone !== Infinity) parts.push(`${t('resources.stone')}: ${Math.floor(gameState.stone)}/${Math.floor(cap.stone)}`);
  if (cap.food  !== Infinity) parts.push(`${t('resources.food')}: ${Math.floor(gameState.food)}/${Math.floor(cap.food)}`);

  return (
    <View style={{ paddingHorizontal: 4, paddingVertical: 8, opacity: 0.6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 11 }}>💾</Text>
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
          {t('storage.totalCap')}: {parts.length > 0 ? parts.join(' · ') : t('storage.unlimited')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
        <Text style={{ fontSize: 11 }}>💪</Text>
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
          {Math.floor(gameState.muskelmasse)}g · 💎 {Math.floor(gameState.protein)} {t('resources.protein')} ({t('storage.unlimited')})
        </Text>
      </View>
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
