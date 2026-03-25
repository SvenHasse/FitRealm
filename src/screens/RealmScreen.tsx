// RealmScreen.tsx
// FitRealm - Realm tab: scrollable world map with HUD overlay and sheets

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  Dimensions, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withRepeat, withDelay, Easing,
} from 'react-native-reanimated';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
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
import AnimalSheet from '../components/AnimalSheet';
import AnimalRenderer from '../../village-assets/components/AnimalRenderer';

const CELL_SIZE = 70;
const GRID_SIZE = WorldConstants.gridSize;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PLAYFIELD_SIZE = GRID_SIZE * CELL_SIZE;

// ── Seeded LCG for deterministic grass texture (doesn't change on re-render) ──
function makeLCG(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
}
interface GrassPatch { x: number; y: number; w: number; h: number; dark: boolean; rotation: number }
const _gr = makeLCG(0xBEEFCAFE);
const GRASS_PATCHES: GrassPatch[] = Array.from({ length: 36 }, () => ({
  x: _gr() * PLAYFIELD_SIZE, y: _gr() * PLAYFIELD_SIZE,
  w: 20 + _gr() * 40,        h: 10 + _gr() * 25,
  dark: _gr() > 0.5,         rotation: _gr() * 360,
}));

// ── Per-building visual config for the map cells ──────────────────────────────
const CELL_CFG: Record<string, { icon: string; color: string }> = {
  rathaus:      { icon: 'home-city',      color: '#7B68EE' },
  kornkammer:   { icon: 'grain',          color: '#F5A623' },
  proteinfarm:  { icon: 'lightning-bolt', color: '#9B59B6' },
  holzfaeller:  { icon: 'axe',           color: '#A0784A' },
  steinbruch:   { icon: 'pickaxe',       color: '#9E9E9E' },
  feld:         { icon: 'sprout',        color: '#4CAF50' },
  holzlager:    { icon: 'warehouse',     color: '#607D8B' },
  steinlager:   { icon: 'layers-triple', color: '#78909C' },
  nahrungslager:{ icon: 'basket',        color: '#FF8C00' },
  kaserne:      { icon: 'shield-sword',  color: '#3E8A40' },
  tempel:       { icon: 'flare',         color: '#E8C948' },
  bibliothek:   { icon: 'bookshelf',     color: '#5C8A6A' },
  marktplatz:   { icon: 'store',         color: '#FF7043' },
  stammeshaus:  { icon: 'account-group', color: '#2196F3' },
  stall:        { icon: 'paw',           color: '#C4934A' },
};

export default function RealmScreen() {
  const store = useGameStore();
  const { gameState, obstacles } = store;
  const { t } = useTranslation();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedStall, setSelectedStall] = useState<Building | null>(null);
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
    if (building) {
      if (building.type === BuildingType.stall && building.level >= 1) {
        setSelectedStall(building);
      } else {
        setSelectedBuilding(building);
      }
      return;
    }

    const obstacle = obstacles.find(o => o.row === row && o.col === col && !o.isCleared);
    if (obstacle) { setSelectedObstacle(obstacle); return; }

    if (buildPlacementMode) {
      if (obstacles.some(o => o.row === row && o.col === col && !o.isCleared)) return;
      const [ok] = canBuild(gameState, buildPlacementMode, { row, col });
      if (ok) {
        const isFirstStall = buildPlacementMode === BuildingType.stall &&
          !gameState.buildings.some(b => b.type === BuildingType.stall);
        store.buildBuilding(buildPlacementMode, { row, col });
        setBuildPlacementMode(null);
        if (isFirstStall) {
          setToastMessage('Ein Erntehuhn hat sich in deinem Stall niedergelassen!');
          setTimeout(() => setToastMessage(null), 3500);
        }
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
            {/* Grass base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A4A0A' }]} />
            {/* Organic grass texture patches */}
            {GRASS_PATCHES.map((p, i) => (
              <View key={`gp${i}`} style={{
                position: 'absolute', left: p.x, top: p.y,
                width: p.w, height: p.h,
                backgroundColor: p.dark ? '#163808' : '#1E5210',
                borderRadius: p.w / 2, opacity: 0.48,
                transform: [{ rotate: `${p.rotation}deg` }],
              }} />
            ))}
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
                    {building ? <BuildingCell building={building} isHighlighted={highlightedBuildingId === building.id} idx={row * GRID_SIZE + col} assignedAnimal={gameState.animals.find(a => a.assignment.type === 'building' && (a.assignment as any).buildingId === building.id)} /> : obstacle ? <ObstacleCell obstacle={obstacle} /> : isPlacementTarget ? <Ionicons name="add" size={20} color="rgba(76,175,80,0.6)" /> : null}
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

      {/* Animal Sheet Modal */}
      <Modal visible={selectedStall != null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            {selectedStall && (
              <AnimalSheet stall={selectedStall} onClose={() => setSelectedStall(null)} />
            )}
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
function BuildingCell({ building, isHighlighted, idx, assignedAnimal }: { building: Building; isHighlighted?: boolean; idx: number; assignedAnimal?: import('../models/types').Animal | null }) {
  const cfg   = CELL_CFG[building.type] ?? { icon: 'help-circle', color: '#888' };
  const color = building.isDecayed ? '#555' : cfg.color;
  const LEVEL_COLORS: Record<number, string> = { 1:'#9E9E9E', 2:'#66BB6A', 3:'#42A5F5', 4:'#AB47BC', 5:'#FFD54F' };

  // Highlight pulse
  const hiScale = useSharedValue(1);
  useEffect(() => {
    if (isHighlighted) {
      hiScale.value = withSequence(
        withTiming(1.15, { duration: 370, easing: Easing.out(Easing.cubic) }),
        withTiming(1.0,  { duration: 370, easing: Easing.in(Easing.cubic) }),
        withTiming(1.15, { duration: 370 }),
        withTiming(1.0,  { duration: 370 }),
      );
    }
  }, [isHighlighted]);

  // Idle breathing — staggered by position so buildings don't all pulse together
  const breath = useSharedValue(1);
  useEffect(() => {
    breath.value = withDelay(
      (idx % 12) * 300,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.00, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hiScale.value * breath.value }],
  }));

  const bounce = useSharedValue(0);
  useEffect(() => {
    if (assignedAnimal) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0,  { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, false,
      );
    }
  }, [assignedAnimal?.id]);
  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  // Construction countdown (updates every 10 s)
  const [countdown, setCountdown] = useState(() => fmtConstructionTime(building.constructionEndsAt));
  useEffect(() => {
    if (!building.isUnderConstruction) return;
    setCountdown(fmtConstructionTime(building.constructionEndsAt));
    const id = setInterval(() => setCountdown(fmtConstructionTime(building.constructionEndsAt)), 10000);
    return () => clearInterval(id);
  }, [building.isUnderConstruction, building.constructionEndsAt]);

  if (building.isUnderConstruction) {
    return (
      <Animated.View style={[styles.buildingCard, animStyle, {
        backgroundColor: `${AppColors.gold}18`, borderColor: `${AppColors.gold}60`,
        shadowColor: AppColors.gold,
      }]}>
        <MaterialCommunityIcons name={'hammer-wrench' as any} size={26} color={AppColors.gold} />
        <View style={[styles.levelPill, { backgroundColor: AppColors.gold }]}>
          <Text style={styles.levelPillText}>L{building.targetLevel}</Text>
        </View>
        {countdown !== null && (
          <View style={[styles.resourceBubble, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
            <Text style={[styles.resourceBubbleText, { color: AppColors.gold }]}>{countdown}</Text>
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.buildingCard, animStyle,
      { backgroundColor: `${color}20`, borderColor: `${color}55`, shadowColor: color },
      isHighlighted && styles.highlightedCell,
    ]}>
      <MaterialCommunityIcons name={cfg.icon as any} size={28} color={color} />
      {/* Level pill — bottom-right */}
      <View style={[styles.levelPill, { backgroundColor: LEVEL_COLORS[building.level] ?? '#9E9E9E' }]}>
        <Text style={styles.levelPillText}>L{building.level}</Text>
      </View>
      {/* Storage bubble — bottom-left */}
      {building.currentStorage > 0 && (
        <View style={styles.resourceBubble}>
          <Text style={styles.resourceBubbleText}>{Math.floor(building.currentStorage)}</Text>
        </View>
      )}
      {assignedAnimal && (
        <Animated.View style={[styles.animalSprite, bounceStyle]} pointerEvents="none">
          <AnimalRenderer type={assignedAnimal.type} size={20} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

// MARK: - Obstacle Cell
function ObstacleCell({ obstacle }: { obstacle: Obstacle }) {
  let visual: React.ReactElement;

  switch (obstacle.type) {
    case 'smallRock':
      visual = (
        <View style={{ width:28, height:20, backgroundColor:'#5A6050', borderRadius:6,
          borderTopWidth:2, borderTopColor:'#7A8070', borderBottomWidth:2, borderBottomColor:'#3A4040' }}>
          <View style={{ position:'absolute', top:4, left:6, width:10, height:6,
            backgroundColor:'rgba(255,255,255,0.08)', borderRadius:3 }} />
        </View>
      );
      break;
    case 'branch':
      visual = (
        <View style={{ width:36, height:20 }}>
          <View style={{ position:'absolute', width:28, height:3, backgroundColor:'#6B4A22',
            borderRadius:2, top:4,  left:2, transform:[{rotate:'-8deg'}] }} />
          <View style={{ position:'absolute', width:22, height:3, backgroundColor:'#7B5A32',
            borderRadius:2, top:10, left:6, transform:[{rotate:'5deg'}] }} />
          <View style={{ position:'absolute', width:18, height:3, backgroundColor:'#5C3D1E',
            borderRadius:2, top:16, left:4, transform:[{rotate:'-12deg'}] }} />
        </View>
      );
      break;
    case 'mushrooms':
      visual = (
        <View style={{ alignItems:'center', width:30, height:26 }}>
          <View style={{ position:'absolute', bottom:0, left:7,  width:5, height:8, backgroundColor:'#EEE8D5', borderRadius:2 }} />
          <View style={{ position:'absolute', bottom:0, left:18, width:4, height:6, backgroundColor:'#EEE8D5', borderRadius:2 }} />
          <View style={{ position:'absolute', top:2,  left:2,  width:16, height:12, borderRadius:8, backgroundColor:'#CC3333' }} />
          <View style={{ position:'absolute', top:4,  left:16, width:13, height:10, borderRadius:7, backgroundColor:'#E53935' }} />
          <View style={{ position:'absolute', top:1,  left:5,  width:3,  height:3,  borderRadius:2, backgroundColor:'rgba(255,255,255,0.5)' }} />
        </View>
      );
      break;
    case 'largeTree':
      visual = (
        <View style={{ alignItems:'center', width:34, height:38 }}>
          <View style={{ position:'absolute', bottom:0, width:6, height:12, backgroundColor:'#4A2E10', borderRadius:2 }} />
          <View style={{ position:'absolute', top:10, width:30, height:24, borderRadius:15, backgroundColor:'#1A5010' }} />
          <View style={{ position:'absolute', top:4,  width:24, height:20, borderRadius:12, backgroundColor:'#226A14' }} />
          <View style={{ position:'absolute', top:0,  width:18, height:16, borderRadius:9,  backgroundColor:'#2A7A1A' }} />
        </View>
      );
      break;
    case 'deadTree':
      visual = (
        <View style={{ alignItems:'center', width:30, height:38 }}>
          <View style={{ position:'absolute', bottom:0, width:5, height:20, backgroundColor:'#4A3A28', borderRadius:2 }} />
          <View style={{ position:'absolute', top:6,  width:22, height:16, borderRadius:8, backgroundColor:'#3A3328' }} />
          <View style={{ position:'absolute', top:2,  width:16, height:13, borderRadius:6, backgroundColor:'#4A4038' }} />
          <View style={{ position:'absolute', top:4, left:20, width:8, height:3, backgroundColor:'#4A3A28', borderRadius:2, transform:[{rotate:'30deg'}] }} />
        </View>
      );
      break;
    case 'boulder':
      visual = (
        <View>
          <View style={{ width:32, height:26, backgroundColor:'#607060', borderRadius:10,
            borderTopWidth:2, borderTopColor:'#808870', borderBottomWidth:2, borderBottomColor:'#404840' }} />
          <View style={{ position:'absolute', top:5, left:6, width:12, height:7,
            backgroundColor:'rgba(255,255,255,0.07)', borderRadius:4 }} />
          <View style={{ position:'absolute', top:13, left:16, width:8, height:5,
            backgroundColor:'rgba(0,0,0,0.15)', borderRadius:3 }} />
        </View>
      );
      break;
    default:
      visual = <Ionicons name="help-circle" size={24} color="#888" />;
  }

  return (
    <View style={{ alignItems:'center', justifyContent:'center', opacity: obstacle.isClearing ? 0.5 : 1 }}>
      {visual}
      {obstacle.isClearing && (
        <View style={{ position:'absolute' }}>
          <Ionicons name="cog" size={14} color="rgba(255,255,255,0.85)" />
        </View>
      )}
    </View>
  );
}

// MARK: - Number formatting
function fmtNum(n: number, lang: string): string {
  const sep = lang === 'de' ? '.' : ',';
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

// MARK: - Top Resource Bar (collapsible)
function TopResourceBar({ onResourcePress }: { onResourcePress: (r: ResourceKey) => void }) {
  const gs  = useGameStore(s => s.gameState);
  const cap = useGameStore(s => s.storageCap);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 220,
      create:  { type: 'easeInEaseOut', property: 'opacity' },
      update:  { type: 'easeInEaseOut' },
      delete:  { type: 'easeInEaseOut', property: 'opacity' },
    });
    setCollapsed(c => !c);
  };

  // Warning colours for collapsed icon strip
  const woodRatio  = cap.wood  > 0 && cap.wood  !== Infinity ? gs.wood  / cap.wood  : 0;
  const stoneRatio = cap.stone > 0 && cap.stone !== Infinity ? gs.stone / cap.stone : 0;
  const foodRatio  = cap.food  > 0 && cap.food  !== Infinity ? gs.food  / cap.food  : 0;
  const woodColor  = woodRatio  >= 1 ? '#FF5252' : woodRatio  >= 0.8 ? '#FF9800' : '#A0826D';
  const stoneColor = stoneRatio >= 1 ? '#FF5252' : stoneRatio >= 0.8 ? '#FF9800' : '#9E9E9E';
  const foodColor  = foodRatio  >= 1 ? '#FF5252' : foodRatio  >= 0.8 ? '#FF9800' : '#4CAF50';

  if (collapsed) {
    return (
      <TouchableOpacity style={styles.collapsedPill} onPress={toggle} activeOpacity={0.8}>
        {/* Currencies */}
        <View style={styles.collapsedIconGroup}>
          <Ionicons name="barbell" size={18} color={AppColors.gold} />
          <MaterialCommunityIcons name="diamond-stone" size={18} color="#00BCD4" />
        </View>
        <View style={styles.collapsedSep} />
        {/* Resources */}
        <View style={styles.collapsedIconGroup}>
          <Ionicons name="hammer" size={18} color={woodColor} />
          <Ionicons name="cube"   size={18} color={stoneColor} />
          <Ionicons name="leaf"   size={18} color={foodColor} />
        </View>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.35)" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.resourceBar}>
      {/* ── Currency Card: Muskelmasse + Protein ── */}
      <View style={styles.currencyCard}>
        <TouchableOpacity style={styles.currencySlot} onPress={() => onResourcePress('muskelmasse')} activeOpacity={0.75}>
          <View style={styles.currencyIconWrap}>
            <Ionicons name="barbell" size={15} color={AppColors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currencyValue} numberOfLines={1}>{fmtNum(gs.muskelmasse, lang)}g</Text>
            <Text style={styles.currencyLabel}>MUSKELMASSE</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.currencyDivider} />

        <TouchableOpacity style={styles.currencySlot} onPress={() => onResourcePress('protein')} activeOpacity={0.75}>
          <View style={[styles.currencyIconWrap, { backgroundColor: 'rgba(0,188,212,0.18)' }]}>
            <MaterialCommunityIcons name="diamond-stone" size={15} color="#00BCD4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.currencyValue, { color: '#00BCD4' }]} numberOfLines={1}>{fmtNum(gs.protein, lang)}</Text>
            <Text style={styles.currencyLabel}>PROTEIN</Text>
          </View>
        </TouchableOpacity>

        {/* Collapse button */}
        <TouchableOpacity onPress={toggle} style={styles.collapseBtn} activeOpacity={0.6}>
          <Ionicons name="chevron-up" size={14} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>

      {/* ── Resource Bars: Holz / Stein / Nahrung ── */}
      <View style={styles.resourceBarsCard}>
        <ResourceBarRow
          icon="hammer" iconColor="#A0826D" label={t('hud.holz')}
          current={gs.wood}  max={cap.wood  === Infinity ? 0 : cap.wood}
          onPress={() => onResourcePress('wood')} lang={lang}
        />
        <View style={styles.barDivider} />
        <ResourceBarRow
          icon="cube" iconColor="#9E9E9E" label={t('hud.stein')}
          current={gs.stone} max={cap.stone === Infinity ? 0 : cap.stone}
          onPress={() => onResourcePress('stone')} lang={lang}
        />
        <View style={styles.barDivider} />
        <ResourceBarRow
          icon="leaf" iconColor="#4CAF50" label={t('hud.nahrung')}
          current={gs.food}  max={cap.food  === Infinity ? 0 : cap.food}
          onPress={() => onResourcePress('food')} lang={lang}
        />
      </View>
    </View>
  );
}

// ── Single animated resource bar row ─────────────────────────────────────────
interface ResourceBarRowProps {
  icon: string;
  iconColor: string;
  label: string;
  current: number;
  max: number;      // 0 = uncapped / unknown
  onPress: () => void;
  lang: string;
}

function ResourceBarRow({ icon, iconColor, label, current, max, onPress, lang }: ResourceBarRowProps) {
  const hasCap   = max > 0;
  const ratio    = hasCap ? Math.min(current / max, 1) : 0;
  const isFull   = hasCap && ratio >= 1.0;
  const isAlmost = hasCap && ratio >= 0.8 && !isFull;

  // Animate bar fill width via onLayout container width
  const [containerW, setContainerW] = useState(0);
  const fillAnim   = useSharedValue(0);
  const glowAnim   = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [ratio]);

  // Pulse glow when almost full or full
  useEffect(() => {
    if (isFull || isAlmost) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.3, { duration: 700 }),
        ), -1, true,
      );
    } else {
      glowAnim.value = withTiming(0, { duration: 300 });
    }
  }, [isFull, isAlmost]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillAnim.value * containerW,
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const barColor   = isFull ? '#FF5252' : isAlmost ? '#FF9800' : iconColor;
  const maxStr     = hasCap ? fmtNum(max, lang) : '∞';
  const currentStr = fmtNum(current, lang);

  return (
    <TouchableOpacity style={styles.barRow} onPress={onPress} activeOpacity={0.7}>
      {/* Icon */}
      <View style={[styles.barIconWrap, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon as any} size={13} color={iconColor} />
      </View>

      {/* Label */}
      <Text style={styles.barLabel}>{label}</Text>

      {/* Progress track */}
      <View
        style={styles.barTrack}
        onLayout={e => setContainerW(e.nativeEvent.layout.width)}
      >
        {/* Background shimmer */}
        <View style={[styles.barTrackBg]} />
        {/* Fill */}
        <Animated.View style={[styles.barFill, { backgroundColor: barColor }, fillStyle]} />
        {/* Glow overlay */}
        {(isFull || isAlmost) && (
          <Animated.View style={[styles.barGlow, { backgroundColor: barColor }, glowStyle]} />
        )}
      </View>

      {/* Numbers */}
      <Text style={[styles.barNumbers, isFull && { color: '#FF5252' }, isAlmost && !isFull && { color: '#FF9800' }]}>
        {currentStr}<Text style={styles.barMax}>/{maxStr}</Text>
      </Text>
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
  container: { flex: 1, backgroundColor: '#091808' },
  mapScroll: { flex: 1, backgroundColor: '#091808' },
  gridContainer: {
    position: 'relative',
    borderRadius: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 10,
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)',
  },
  placementCell: { borderWidth: 1, borderColor: 'rgba(76,175,80,0.45)', borderStyle: 'dashed' },
  // Building card
  buildingCard: {
    width: CELL_SIZE - 8, height: CELL_SIZE - 8,
    borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6,
    elevation: 4,
  },
  highlightedCell: { borderWidth: 2, borderColor: '#F5A623', borderRadius: 10 },
  levelPill: {
    position: 'absolute', bottom: 3, right: 3,
    borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1,
  },
  levelPillText: { fontSize: 8, color: '#1A0800', fontWeight: 'bold' },
  resourceBubble: {
    position: 'absolute', bottom: 2, left: 3,
    backgroundColor: 'rgba(30,200,80,0.75)',
    borderRadius: 5, paddingHorizontal: 3, paddingVertical: 1,
  },
  resourceBubbleText: { fontSize: 7, fontWeight: 'bold', color: '#fff' },
  animalSprite: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 1,
  },
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
  resourceBar: { gap: 6 },

  // ── Collapsed pill ─────────────────────────────────────────────────────────
  collapsedPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,20,40,0.95)',
    borderRadius: 14, paddingVertical: 9, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(245,166,35,0.15)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
    gap: 10,
  },
  collapsedIconGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  collapsedSep: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.12)' },

  // ── Currency card (Muskelmasse + Protein) ──────────────────────────────────
  currencyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,20,40,0.95)',
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 4,
    borderWidth: 1, borderColor: 'rgba(245,166,35,0.18)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  currencySlot: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10,
  },
  currencyIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(245,166,35,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  currencyValue: { fontSize: 15, fontWeight: 'bold', color: AppColors.gold },
  currencyLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, marginTop: 1 },
  currencyDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  collapseBtn: { paddingHorizontal: 8, paddingVertical: 4 },

  // ── Resource bars card (Holz / Stein / Nahrung) ────────────────────────────
  resourceBarsCard: {
    backgroundColor: 'rgba(20,20,40,0.95)',
    borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    gap: 0,
  },
  barRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6,
  },
  barDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  barIconWrap: {
    width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
  },
  barLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', width: 48 },
  barTrack: {
    flex: 1, height: 7, borderRadius: 4, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)', position: 'relative',
  },
  barTrackBg: { ...StyleSheet.absoluteFillObject, borderRadius: 4 },
  barFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 4 },
  barGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 4,
  },
  barNumbers: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)',
    minWidth: 68, textAlign: 'right',
  },
  barMax: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '400' },

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
