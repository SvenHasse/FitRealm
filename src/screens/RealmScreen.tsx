// RealmScreen.tsx
// FitRealm - Realm tab: scrollable world map with HUD overlay and sheets

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';
import {
  AppColors, Building, BuildingType, Obstacle,
  buildingIconName, buildingAccentColor,
  obstacleIsSmall, obstacleRemovalCost,
  workerStatus, WorkerStatus,
  zoneIsExploring,
} from '../models/types';
import { WorldConstants } from '../config/GameConfig';
import { canBuild } from '../engines/GameEngine';
import BuildingDetailSheet from '../components/BuildingDetailSheet';
import BuildMenuSheet from '../components/BuildMenuSheet';
import WorkerSheet from '../components/WorkerSheet';
import ResourceInfoModal, { ResourceKey } from '../components/ResourceInfoModal';

const CELL_SIZE = 70;
const GRID_SIZE = WorldConstants.gridSize;

export default function RealmScreen() {
  const store = useEngineStore();
  const { gameState, obstacles } = store;
  const { t } = useTranslation();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);
  const [buildPlacementMode, setBuildPlacementMode] = useState<BuildingType | null>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceKey | null>(null);

  useEffect(() => {
    store.processTick();
    store.checkObstacleCompletion();
  }, []);

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
        contentOffset={{ x: (GRID_SIZE * CELL_SIZE - Dimensions.get('window').width) / 2, y: (GRID_SIZE * CELL_SIZE - Dimensions.get('window').height) / 2 }}
      >
        <ScrollView
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
                    {building ? <BuildingCell building={building} /> : obstacle ? <ObstacleCell obstacle={obstacle} /> : isPlacementTarget ? <Ionicons name="add" size={20} color="rgba(76,175,80,0.6)" /> : null}
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
          <TouchableOpacity style={styles.hudBtn} onPress={() => store.collectAll()}>
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
    </View>
  );
}

// MARK: - Building Cell
function BuildingCell({ building }: { building: Building }) {
  const accent = buildingAccentColor(building.type);
  const levelColors: Record<number, string> = { 1: '#9E9E9E', 2: '#66BB6A', 3: '#42A5F5', 4: '#AB47BC', 5: '#FFD54F' };
  return (
    <View style={styles.buildingCell}>
      <Ionicons name={buildingIconName(building.type) as any} size={28} color={building.isDecayed ? '#666' : accent} />
      <View style={[styles.levelBadge, { backgroundColor: levelColors[building.level] || '#9E9E9E' }]}>
        <Text style={styles.levelText}>{building.level}</Text>
      </View>
      {building.currentStorage > 0 && (
        <View style={styles.resourceBubble}>
          <Text style={styles.resourceBubbleText}>{Math.floor(building.currentStorage)}</Text>
        </View>
      )}
    </View>
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

// MARK: - Top Resource Bar
function TopResourceBar({ onResourcePress }: { onResourcePress: (r: ResourceKey) => void }) {
  // Building-produced resources (wood/stone/food) live in the game engine store
  const gs = useEngineStore(s => s.gameState);
  // Workout-earned currencies + streak are the single source of truth in gameStore
  const { muskelmasse, protein, streakTokens, currentStreak } = useGameStore();
  const { t } = useTranslation();
  return (
    <View style={styles.resourceBar}>
      <View style={styles.resourceRow}>
        <ResourcePill icon="barbell" iconColor={AppColors.gold} value={`${Math.floor(muskelmasse)}g`} label={t('hud.muskel')} onPress={() => onResourcePress('muskelmasse')} />
        <View style={styles.divider} />
        <ResourcePill icon="medkit" iconColor="#00BCD4" value={`${protein}`} label={t('hud.protein')} onPress={() => onResourcePress('protein')} />
        <View style={styles.divider} />
        <ResourcePill icon="flame" iconColor="#FF9800" value={`${streakTokens}`} label={t('hud.token')} onPress={() => onResourcePress('streakTokens')} />
      </View>
      <View style={[styles.resourceRow, { opacity: 0.85 }]}>
        <ResourcePill icon="hammer" iconColor="#8B7355" value={`${gs.wood}`} label={t('hud.holz')} onPress={() => onResourcePress('wood')} />
        <View style={styles.divider} />
        <ResourcePill icon="cube" iconColor="#9E9E9E" value={`${gs.stone}`} label={t('hud.stein')} onPress={() => onResourcePress('stone')} />
        <View style={styles.divider} />
        <ResourcePill icon="leaf" iconColor="#4CAF50" value={`${gs.food}`} label={t('hud.nahrung')} onPress={() => onResourcePress('food')} />
        {currentStreak > 0 && (
          <>
            <View style={styles.divider} />
            <ResourcePill icon="flash" iconColor="#FFEB3B" value={`${currentStreak}d`} label={t('hud.streak')} onPress={() => onResourcePress('streakTokens')} />
          </>
        )}
      </View>
    </View>
  );
}

function ResourcePill({ icon, iconColor, value, label, onPress }: { icon: string; iconColor: string; value: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.pill} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={11} color={iconColor} />
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
      <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.4)" />
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
  // Engine store handles obstacle actions and worker state
  const store = useEngineStore();
  // New gameStore is the source of truth for muskelmasse
  const { muskelmasse } = useGameStore();
  const { t } = useTranslation();
  const isSmall = obstacleIsSmall(obstacle.type);
  const cost = obstacleRemovalCost(obstacle.type);
  const canRemove = isSmall && muskelmasse >= cost;
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
  pill: { flex: 1, alignItems: 'center', gap: 1 },
  pillValue: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
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
});
