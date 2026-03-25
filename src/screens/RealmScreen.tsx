// RealmScreen.tsx
// FitRealm - Realm tab: scrollable world map with HUD overlay and sheets

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { useGameStore as useCurrencyStore } from '../store/gameStore';
import {
  AppColors, Building, BuildingType, Obstacle,
  buildingIconName, buildingAccentColor,
  obstacleIsSmall, obstacleRemovalCost,
  workerStatus, WorkerStatus,
  zoneIsExploring,
} from '../models/types';
import { WorldConstants } from '../config/GameConfig';
import { canBuild } from '../engines/GameEngine';
import { formatDuration } from '../utils/formatDuration';
import BuildingDetailSheet from '../components/BuildingDetailSheet';
import BuildMenuSheet from '../components/BuildMenuSheet';
import WorkerSheet from '../components/WorkerSheet';
import ResourceInfoModal, { ResourceKey } from '../components/ResourceInfoModal';
import BuildingRegistryModal from '../components/BuildingRegistryModal';
import CollectRewardPopup from '../components/CollectRewardPopup';

const CELL_SIZE = 70;
const GRID_SIZE = WorldConstants.gridSize;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function RealmScreen() {
  const store = useGameStore();
  const { gameState, obstacles } = store;
  const { t } = useTranslation();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);
  const [showRegistry, setShowRegistry] = useState(false);
  const [buildPlacementMode, setBuildPlacementMode] = useState<BuildingType | null>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceKey | null>(null);
  const [highlightedBuildingId, setHighlightedBuildingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastCollectResult = useGameStore(s => s.lastCollectResult);
  const clearCollectResult = useGameStore(s => s.clearCollectResult);

  // Scroll refs for map navigation
  const hScrollRef = useRef<ScrollView>(null);
  const vScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    store.processTick();
    store.checkObstacleCompletion();
  }, []);

  // Clear highlight after 1.5 s
  useEffect(() => {
    if (!highlightedBuildingId) return;
    const timer = setTimeout(() => setHighlightedBuildingId(null), 1500);
    return () => clearTimeout(timer);
  }, [highlightedBuildingId]);

  // Scroll map so the building sits roughly at viewport centre
  const scrollToBuilding = useCallback((row: number, col: number) => {
    const x = Math.max(0, col * CELL_SIZE + 20 - SCREEN_W / 2 + CELL_SIZE / 2);
    const y = Math.max(0, row * CELL_SIZE + 20 - SCREEN_H / 2 + CELL_SIZE / 2);
    hScrollRef.current?.scrollTo({ x, animated: true });
    vScrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  // Called when a building is selected in the registry
  const handleRegistrySelect = useCallback((building: Building) => {
    setShowRegistry(false);
    setHighlightedBuildingId(building.id);
    scrollToBuilding(building.position.row, building.position.col);
  }, [scrollToBuilding]);

  const handleCellPress = (row: number, col: number) => {
    const building = gameState.buildings.find(b => b.position.row === row && b.position.col === col);
    if (building) { setSelectedBuilding(building); return; }

    const obstacle = obstacles.find(o => o.row === row && o.col === col && !o.isCleared);
    if (obstacle) { setSelectedObstacle(obstacle); return; }

    if (buildPlacementMode) {
      if (obstacles.some(o => o.row === row && o.col === col && !o.isCleared)) return;
      const [ok] = canBuild(gameState, buildPlacementMode, { row, col });
      if (ok) {
        store.buildBuilding(buildPlacementMode, { row, col });
        setBuildPlacementMode(null);
      }
    }
  };

  const activeZone = gameState.zones.find(z => zoneIsExploring(z));

  return (
    <View style={styles.container}>
      {/* World Map Grid */}
      <ScrollView
        ref={hScrollRef}
        style={styles.mapScroll}
        contentContainerStyle={{
          width: GRID_SIZE * CELL_SIZE + 40,
          height: GRID_SIZE * CELL_SIZE + 40,
          padding: 20,
        }}
        horizontal
        directionalLockEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: (GRID_SIZE * CELL_SIZE - SCREEN_W) / 2, y: (GRID_SIZE * CELL_SIZE - SCREEN_H) / 2 }}
      >
        <ScrollView
          ref={vScrollRef}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
        >
          <View style={[styles.gridContainer, { width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2D5A27' }]} />
            {Array.from({ length: GRID_SIZE }, (_, row) =>
              Array.from({ length: GRID_SIZE }, (_, col) => {
                const building = gameState.buildings.find(b => b.position.row === row && b.position.col === col);
                const obstacle = obstacles.find(o => o.row === row && o.col === col && !o.isCleared);
                const isPlacementTarget = buildPlacementMode != null && !building && !obstacle;
                return (
                  <TouchableOpacity
                    key={`${row}-${col}`}
                    style={[styles.cell, { left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }, isPlacementTarget && styles.placementCell]}
                    onPress={() => handleCellPress(row, col)}
                    activeOpacity={0.7}
                  >
                    {building ? <BuildingCell building={building} isHighlighted={highlightedBuildingId === building.id} /> : obstacle ? <ObstacleCell obstacle={obstacle} /> : isPlacementTarget ? <Ionicons name="add" size={20} color="rgba(76,175,80,0.6)" /> : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* HUD Top */}
      <View style={styles.hudTop}>
        <TopResourceBar onResourcePress={setSelectedResource} />
      </View>

      {/* HUD Bottom — compact bar */}
      <View style={styles.hudBottom}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.hudBtn} onPress={() => { setBuildPlacementMode(null); setShowBuildMenu(true); }}>
            <Ionicons name="hammer" size={28} color="#F5A623" />
            <Text style={styles.hudBtnLabel}>{t('hud.build')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setShowWorkers(true)}>
            <Ionicons name="people" size={28} color="#00B4D8" />
            <Text style={styles.hudBtnLabel}>{t('hud.workers')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setShowRegistry(true)}>
            <Ionicons name="list" size={28} color="#A78BFA" />
            <Text style={styles.hudBtnLabel}>{t('hud.registry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hudBtn} onPress={() => {
            const result = store.collectAll();
            if (result.totalBuildings === 0) {
              setToastMessage(t('collect.nothingToCollect'));
              setTimeout(() => setToastMessage(null), 2000);
            }
          }}>
            <Ionicons name="download-outline" size={28} color="#00C853" />
            <Text style={styles.hudBtnLabel}>{t('hud.collect')}</Text>
          </TouchableOpacity>
        </View>
        {activeZone && activeZone.explorationEndDate && (
          <ExplorationTimer endDate={activeZone.explorationEndDate} />
        )}
      </View>

      {/* Placement banner */}
      {buildPlacementMode && (
        <View style={styles.placementBanner}>
          <Ionicons name="hand-left" size={16} color="#fff" />
          <Text style={styles.placementText}>{t('realm.tapToPlace', { building: t(`buildings.${buildPlacementMode}`) })}</Text>
          <TouchableOpacity onPress={() => setBuildPlacementMode(null)}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Building Detail Modal */}
      <Modal visible={selectedBuilding != null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            {selectedBuilding && (
              <BuildingDetailSheet buildingID={selectedBuilding.id} onClose={() => setSelectedBuilding(null)} />
            )}
          </View>
        </View>
      </Modal>

      {/* Build Menu Modal */}
      <Modal visible={showBuildMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <BuildMenuSheet onSelectBuilding={(type) => { setBuildPlacementMode(type); setShowBuildMenu(false); }} onClose={() => setShowBuildMenu(false)} />
          </View>
        </View>
      </Modal>

      {/* Workers Modal */}
      <Modal visible={showWorkers} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <WorkerSheet onClose={() => setShowWorkers(false)} />
          </View>
        </View>
      </Modal>

      {/* Obstacle Modal */}
      <Modal visible={selectedObstacle != null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            {selectedObstacle && (
              <ObstacleRemovalSheet obstacle={selectedObstacle} onClose={() => setSelectedObstacle(null)} />
            )}
          </View>
        </View>
      </Modal>
      {/* Resource Info Modal */}
      <ResourceInfoModal resource={selectedResource} onClose={() => setSelectedResource(null)} />

      {/* Building Registry Modal */}
      <BuildingRegistryModal
        visible={showRegistry}
        onClose={() => setShowRegistry(false)}
        onSelectBuilding={handleRegistrySelect}
      />

      {/* Collect Reward Popup */}
      {lastCollectResult && (
        <CollectRewardPopup result={lastCollectResult} onClose={clearCollectResult} />
      )}

      {/* Nothing-to-collect toast */}
      {toastMessage && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

// MARK: - Construction countdown helper (uses shared formatDuration)
function fmtConstructionTime(endsAt: number | null): string | null {
  if (!endsAt) return null;
  const rem = Math.max(0, (endsAt - Date.now()) / 1000);
  if (rem <= 0) return null;
  return formatDuration(Math.floor(rem));
}

// MARK: - Building Cell
function BuildingCell({ building, isHighlighted }: { building: Building; isHighlighted?: boolean }) {
  const accent = buildingAccentColor(building.type);
  const levelColors: Record<number, string> = { 1: '#9E9E9E', 2: '#66BB6A', 3: '#42A5F5', 4: '#AB47BC', 5: '#FFD54F' };

  // Highlight pulse animation (scale 1.0 → 1.15 → 1.0, twice, over 1.5 s)
  const scale = useSharedValue(1);
  useEffect(() => {
    if (isHighlighted) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 370, easing: Easing.out(Easing.cubic) }),
        withTiming(1.0,  { duration: 370, easing: Easing.in(Easing.cubic) }),
        withTiming(1.15, { duration: 370 }),
        withTiming(1.0,  { duration: 370 }),
      );
    }
  }, [isHighlighted]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Construction countdown (updates every 10s)
  const [countdown, setCountdown] = useState(() => fmtConstructionTime(building.constructionEndsAt));
  useEffect(() => {
    if (!building.isUnderConstruction) return;
    setCountdown(fmtConstructionTime(building.constructionEndsAt));
    const id = setInterval(() => setCountdown(fmtConstructionTime(building.constructionEndsAt)), 10000);
    return () => clearInterval(id);
  }, [building.isUnderConstruction, building.constructionEndsAt]);

  if (building.isUnderConstruction) {
    return (
      <Animated.View style={[styles.buildingCell, animStyle, { borderWidth: 2, borderColor: `${AppColors.gold}90`, borderRadius: 6 }]}>
        <Ionicons name={"build-outline" as any} size={24} color={AppColors.gold} />
        <View style={[styles.levelBadge, { backgroundColor: AppColors.gold }]}>
          <Text style={[styles.levelText, { color: '#000' }]}>{building.targetLevel}</Text>
        </View>
        {countdown !== null && (
          <View style={[styles.resourceBubble, { backgroundColor: '#333' }]}>
            <Text style={[styles.resourceBubbleText, { color: AppColors.gold }]}>{countdown}</Text>
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.buildingCell, animStyle, isHighlighted && styles.highlightedCell]}>
      <Ionicons name={buildingIconName(building.type) as any} size={28} color={building.isDecayed ? '#666' : accent} />
      <View style={[styles.levelBadge, { backgroundColor: levelColors[building.level] || '#9E9E9E' }]}>
        <Text style={styles.levelText}>{building.level}</Text>
      </View>
      {building.currentStorage > 0 && (
        <View style={styles.resourceBubble}>
          <Text style={styles.resourceBubbleText}>{Math.floor(building.currentStorage)}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// MARK: - Obstacle Cell
function ObstacleCell({ obstacle }: { obstacle: Obstacle }) {
  const colors: Record<string, string> = {
    branch: '#8B5E3C', smallRock: '#9E9E9E', mushrooms: '#E53935',
    largeTree: '#2E7D32', boulder: '#78909C', deadTree: '#795548',
  };
  const icons: Record<string, string> = {
    branch: 'remove', smallRock: 'cube', mushrooms: 'leaf',
    largeTree: 'leaf', boulder: 'triangle', deadTree: 'leaf',
  };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', opacity: obstacle.isClearing ? 0.5 : 1 }}>
      <Ionicons name={icons[obstacle.type] as any || 'help'} size={24} color={colors[obstacle.type] || '#888'} />
      {obstacle.isClearing && <Ionicons name="cog" size={14} color="rgba(255,255,255,0.7)" style={{ position: 'absolute' }} />}
    </View>
  );
}

// MARK: - Number formatting
function fmtNum(n: number, lang: string): string {
  const sep = lang === 'de' ? '.' : ',';
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

// MARK: - Top Resource Bar
function TopResourceBar({ onResourcePress }: { onResourcePress: (r: ResourceKey) => void }) {
  const gs = useGameStore(s => s.gameState);
  const cap = useGameStore(s => s.storageCap);
  const { currentStreak } = useCurrencyStore();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <View style={styles.resourceBar}>
      <View style={styles.resourceRow}>
        {/* Muskelmasse — uncapped */}
        <ResourcePill icon="barbell" iconColor={AppColors.gold}
          value={`${fmtNum(gs.muskelmasse, lang)}g`}
          label={t('hud.muskel')} onPress={() => onResourcePress('muskelmasse')} lang={lang} />
        <View style={styles.divider} />
        {/* Protein — uncapped */}
        <ResourcePill icon="medkit" iconColor="#00BCD4"
          value={`${fmtNum(gs.protein, lang)}`}
          label={t('hud.protein')} onPress={() => onResourcePress('protein')} lang={lang} />
        <View style={styles.divider} />
        {/* Streak tokens — uncapped */}
        <ResourcePill icon="flame" iconColor="#FF9800"
          value={`${fmtNum(gs.streakTokens, lang)}`}
          label={t('hud.token')} onPress={() => onResourcePress('streakTokens')} lang={lang} />
      </View>
      <View style={[styles.resourceRow, { opacity: 0.9 }]}>
        {/* Wood — capped */}
        <ResourcePill icon="hammer" iconColor="#8B7355"
          value={`${fmtNum(gs.wood, lang)}`}
          max={cap.wood === Infinity ? undefined : cap.wood} current={gs.wood}
          label={t('hud.holz')} onPress={() => onResourcePress('wood')} lang={lang} />
        <View style={styles.divider} />
        {/* Stone — capped */}
        <ResourcePill icon="cube" iconColor="#9E9E9E"
          value={`${fmtNum(gs.stone, lang)}`}
          max={cap.stone === Infinity ? undefined : cap.stone} current={gs.stone}
          label={t('hud.stein')} onPress={() => onResourcePress('stone')} lang={lang} />
        <View style={styles.divider} />
        {/* Food — capped */}
        <ResourcePill icon="leaf" iconColor="#4CAF50"
          value={`${fmtNum(gs.food, lang)}`}
          max={cap.food === Infinity ? undefined : cap.food} current={gs.food}
          label={t('hud.nahrung')} onPress={() => onResourcePress('food')} lang={lang} />
        {currentStreak > 0 && (
          <>
            <View style={styles.divider} />
            <ResourcePill icon="flash" iconColor="#FFEB3B"
              value={`${currentStreak}d`}
              label={t('hud.streak')} onPress={() => onResourcePress('streakTokens')} lang={lang} />
          </>
        )}
      </View>
    </View>
  );
}

interface ResourcePillProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
  onPress: () => void;
  lang: string;
  max?: number;
  current?: number;
  suffix?: string;
}

function ResourcePill({ icon, iconColor, value, label, onPress, lang, max, current }: ResourcePillProps) {
  const ratio = (max && max > 0 && current !== undefined) ? current / max : 0;
  const isFull   = ratio >= 1.0;
  const isAlmost = ratio >= 0.8 && !isFull;
  const borderColor = isFull ? '#FF6B6B' : isAlmost ? '#F5A623' : 'transparent';
  const bgColor = isFull ? 'rgba(255,80,80,0.15)' : 'transparent';
  const maxStr = max !== undefined ? fmtNum(max, lang) : null;

  return (
    <TouchableOpacity
      style={[styles.pill, { borderColor, borderWidth: isFull || isAlmost ? 1 : 0, borderRadius: 8, backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={11} color={iconColor} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
        <Text style={styles.pillValue}>{value}</Text>
        {maxStr !== null && (
          <Text style={styles.pillMax}> /{maxStr}</Text>
        )}
      </View>
      <Text style={styles.pillLabel}>{label}</Text>
      {isFull   && <Text style={{ fontSize: 9 }}>🔴</Text>}
      {isAlmost && !isFull && <Text style={{ fontSize: 9 }}>⚠️</Text>}
      {!isFull  && !isAlmost && <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.4)" />}
    </TouchableOpacity>
  );
}

function ExplorationTimer({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, (new Date(endDate).getTime() - Date.now()) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = Math.floor(remaining % 60);
  const formatted = h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, '0')}`;
  return (
    <View style={styles.explorationPill}>
      <Ionicons name="map" size={10} color="rgba(255,255,255,0.7)" />
      <Text style={styles.explorationText}>{formatted}</Text>
    </View>
  );
}

// MARK: - Obstacle Removal Sheet
function ObstacleRemovalSheet({ obstacle, onClose }: { obstacle: Obstacle; onClose: () => void }) {
  const store = useGameStore();
  const { t } = useTranslation();
  const isSmall = obstacleIsSmall(obstacle.type);
  const cost = obstacleRemovalCost(obstacle.type);
  const canRemove = isSmall && store.gameState.muskelmasse >= cost;
  const hasIdleWorker = store.gameState.workers.some(w => workerStatus(w) === WorkerStatus.idle);

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{t(`obstacles.${obstacle.type}`)}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: AppColors.gold, fontWeight: '600' }}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <Ionicons name="alert-circle" size={40} color="#FF9800" />
      </View>
      {isSmall ? (
        <>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>{t('obstacles.cost', { cost })}</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: canRemove ? AppColors.gold : 'rgba(128,128,128,0.3)', marginTop: 16 }]}
            onPress={() => { if (canRemove) { store.removeSmallObstacle(obstacle.id); onClose(); } }}
            disabled={!canRemove}
          >
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: canRemove ? '#000' : '#888' }}>{t('obstacles.remove')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>{t('obstacles.requiresWorker')}</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: hasIdleWorker ? '#42A5F5' : 'rgba(128,128,128,0.2)', marginTop: 16 }]}
            onPress={() => { if (hasIdleWorker) { store.startClearingObstacle(obstacle.id); onClose(); } }}
            disabled={!hasIdleWorker}
          >
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: hasIdleWorker ? '#000' : '#888' }}>
              {hasIdleWorker ? t('obstacles.sendWorker') : t('obstacles.noIdleWorker')}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A3A5C' },
  mapScroll: { flex: 1 },
  gridContainer: { position: 'relative' },
  cell: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)',
  },
  placementCell: { borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)', borderStyle: 'dashed' },
  buildingCell: { alignItems: 'center', justifyContent: 'center' },
  highlightedCell: { borderWidth: 3, borderColor: '#F5A623', borderRadius: 8 },
  levelBadge: {
    position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  levelText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  resourceBubble: {
    position: 'absolute', bottom: 2, backgroundColor: 'rgba(76,175,80,0.8)',
    borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1,
  },
  resourceBubbleText: { fontSize: 8, fontWeight: 'bold', color: '#fff' },
  hudTop: { position: 'absolute', top: 50, left: 12, right: 12 },
  hudBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 6 },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(37, 37, 71, 0.75)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingVertical: 4, paddingHorizontal: 8,
    width: '100%',
  },
  hudBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  hudBtnLabel: { fontSize: 12, color: '#fff', marginTop: 4 },
  resourceBar: { gap: 4 },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(26,26,46,0.92)', borderRadius: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  pill: { flex: 1, alignItems: 'center', gap: 1, paddingVertical: 2, paddingHorizontal: 2 },
  pillValue: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  pillMax: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },
  pillLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)' },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  explorationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: 'rgba(26,26,46,0.9)', borderRadius: 10,
  },
  explorationText: { fontSize: 12, fontWeight: '600', color: '#fff', fontVariant: ['tabular-nums'] },
  placementBanner: {
    position: 'absolute', top: 140, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(245,166,35,0.9)', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  placementText: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: '#1E1E3A',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', minHeight: Dimensions.get('window').height * 0.65,
  },
  dragHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  actionButton: { width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toast: {
    position: 'absolute', bottom: 120, left: 40, right: 40,
    backgroundColor: 'rgba(26,26,46,0.95)', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
});
