// RealmScreen.tsx
// FitRealm - Realm tab: isometric 2.5D world map with HUD overlay and sheets

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  Dimensions, LayoutAnimation, UIManager, Platform, Alert,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withRepeat, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Polygon, G, Text as SvgText, Rect, Circle } from 'react-native-svg';

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
import { gridToScreen, screenToGrid, getGridPixelSize, isTapInDiamond, TILE_W, TILE_H, TILE_DEPTH } from '../utils/isometric';
import IsometricTile from '../components/IsometricTile';
import IsometricBuilding from '../components/IsometricBuilding';
// IsometricForest SVG removed — replaced by pre-rendered ForestParallax PNG
import { ForestParallax } from '../components/village/ForestParallax';
import BuildingDetailSheet from '../components/BuildingDetailSheet';
import BuildMenuSheet from '../components/BuildMenuSheet';
import WorkerSheet from '../components/WorkerSheet';
import ResourceInfoModal, { ResourceKey } from '../components/ResourceInfoModal';
import BuildingRegistryModal from '../components/BuildingRegistryModal';
import CollectRewardPopup from '../components/CollectRewardPopup';
import AnimalSheet from '../components/AnimalSheet';
import AnimalRenderer from '../../village-assets/components/AnimalRenderer';
import WaveBanner from '../components/WaveBanner';
import WaveResultSheet from '../components/WaveResultSheet';
import WaveDetailSheet from '../components/WaveDetailSheet';
import EggHatchModal from '../components/EggHatchModal';
import DragonUnlockModal from '../components/DragonUnlockModal';
import DefenseDashboardModal from '../components/DefenseDashboardModal';
import { MONSTER_CONFIGS } from '../config/EntityConfig';
import { waveService } from '../services/WaveService';
import { Trophy } from '../models/types';

const GRID_SIZE = WorldConstants.gridSize; // 15
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Canvas = just the 15x15 playfield. Forest PNG extends beyond.
const CANVAS_SIZE = getGridPixelSize(GRID_SIZE);
const CANVAS_W = CANVAS_SIZE.width;
const CANVAS_H = CANVAS_SIZE.height;

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

// ── Obstacle SVG rendering ──────────────────────────────────────────────────
function ObstacleSvg({ x, y, type, isClearing }: { x: number; y: number; type: string; isClearing: boolean }) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const cx = x + hw;
  const baseY = y + hh;
  const opacity = isClearing ? 0.5 : 1;

  switch (type) {
    case 'smallRock':
      return (
        <G opacity={opacity}>
          <Polygon points={`${cx - 8},${baseY} ${cx},${baseY - 5} ${cx + 8},${baseY} ${cx},${baseY + 5}`} fill="#5A6050" />
          <Polygon points={`${cx - 8},${baseY} ${cx},${baseY + 5} ${cx},${baseY + 9} ${cx - 8},${baseY + 4}`} fill="#3A4040" />
          <Polygon points={`${cx},${baseY + 5} ${cx + 8},${baseY} ${cx + 8},${baseY + 4} ${cx},${baseY + 9}`} fill="#4A5048" />
        </G>
      );
    case 'branch':
      return (
        <G opacity={opacity}>
          <Rect x={cx - 14} y={baseY - 6} width={28} height={3} rx={1.5} fill="#6B4A22" transform={`rotate(-8,${cx},${baseY})`} />
          <Rect x={cx - 10} y={baseY - 1} width={22} height={3} rx={1.5} fill="#7B5A32" transform={`rotate(5,${cx},${baseY})`} />
          <Rect x={cx - 8} y={baseY + 4} width={18} height={3} rx={1.5} fill="#5C3D1E" transform={`rotate(-12,${cx},${baseY})`} />
        </G>
      );
    case 'mushrooms':
      return (
        <G opacity={opacity}>
          <Rect x={cx - 4} y={baseY - 6} width={4} height={6} fill="#EEE8D5" />
          <Rect x={cx + 3} y={baseY - 4} width={3} height={5} fill="#EEE8D5" />
          <Circle cx={cx - 2} cy={baseY - 10} r={6} fill="#CC3333" />
          <Circle cx={cx + 5} cy={baseY - 8} r={5} fill="#E53935" />
          <Circle cx={cx - 4} cy={baseY - 12} r={1.5} fill="rgba(255,255,255,0.5)" />
        </G>
      );
    case 'largeTree':
      return (
        <G opacity={opacity}>
          <Rect x={cx - 3} y={baseY - 12} width={6} height={12} fill="#4A2E10" />
          <Circle cx={cx} cy={baseY - 22} r={14} fill="#1A5010" />
          <Circle cx={cx} cy={baseY - 26} r={10} fill="#226A14" />
          <Circle cx={cx} cy={baseY - 30} r={7} fill="#2A7A1A" />
        </G>
      );
    case 'deadTree':
      return (
        <G opacity={opacity}>
          <Rect x={cx - 2} y={baseY - 18} width={5} height={18} fill="#4A3A28" />
          <Rect x={cx + 3} y={baseY - 14} width={8} height={3} rx={1.5} fill="#4A3A28" transform={`rotate(30,${cx + 3},${baseY - 14})`} />
          <Circle cx={cx} cy={baseY - 22} r={8} fill="#3A3328" />
          <Circle cx={cx} cy={baseY - 26} r={6} fill="#4A4038" />
        </G>
      );
    case 'boulder':
      return (
        <G opacity={opacity}>
          <Polygon points={`${cx - 12},${baseY} ${cx},${baseY - 8} ${cx + 12},${baseY} ${cx},${baseY + 8}`} fill="#607060" />
          <Polygon points={`${cx - 12},${baseY} ${cx},${baseY + 8} ${cx},${baseY + 14} ${cx - 12},${baseY + 6}`} fill="#404840" />
          <Polygon points={`${cx},${baseY + 8} ${cx + 12},${baseY} ${cx + 12},${baseY + 6} ${cx},${baseY + 14}`} fill="#506050" />
        </G>
      );
    default:
      return (
        <Circle cx={cx} cy={baseY} r={8} fill="#888" opacity={opacity} />
      );
  }
}

// ── Trophy SVG ───────────────────────────────────────────────────────────────
function TrophySvg({ x, y, emoji }: { x: number; y: number; emoji: string }) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return (
    <SvgText
      x={x + hw}
      y={y + hh}
      fontSize={22}
      textAnchor="middle"
      alignmentBaseline="central"
    >
      {emoji}
    </SvgText>
  );
}

// ── Placement indicator (plus sign on empty tiles) ───────────────────────────
function PlacementIndicator({ x, y }: { x: number; y: number }) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const cx = x + hw;
  const cy = y + hh;
  return (
    <G>
      <Rect x={cx - 1} y={cy - 6} width={2} height={12} fill="rgba(76,175,80,0.6)" />
      <Rect x={cx - 6} y={cy - 1} width={12} height={2} fill="rgba(76,175,80,0.6)" />
    </G>
  );
}

export default function RealmScreen() {
  const store = useGameStore();
  const { gameState, obstacles } = store;
  const { t } = useTranslation();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedStall, setSelectedStall] = useState<Building | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);
  const [showRegistry, setShowRegistry] = useState(false);
  const [showDefense, setShowDefense] = useState(false);
  const [buildPlacementMode, setBuildPlacementMode] = useState<BuildingType | null>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceKey | null>(null);
  const [highlightedBuildingId, setHighlightedBuildingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [waveDetailVisible, setWaveDetailVisible] = useState(false);
  const lastCollectResult = useGameStore(s => s.lastCollectResult);
  const clearCollectResult = useGameStore(s => s.clearCollectResult);
  const pendingWaveResult = useGameStore(s => s.pendingWaveResult);
  const clearPendingWaveResult = useGameStore(s => s.clearPendingWaveResult);
  const pendingHatchResult = useGameStore(s => s.pendingHatchResult);
  const clearPendingHatchResult = useGameStore(s => s.clearPendingHatchResult);
  const pendingDragonUnlock = useGameStore(s => s.pendingDragonUnlock);
  const clearPendingDragonUnlock = useGameStore(s => s.clearPendingDragonUnlock);
  const activeWave = gameState.activeWave;
  const [placingTrophy, setPlacingTrophy] = useState<Trophy | null>(null);

  // Scroll ref for map navigation
  const scrollRef = useRef<ScrollView>(null);
  // Track the SVG container layout position for touch conversion
  const svgLayoutRef = useRef({ pageX: 0, pageY: 0 });
  const svgContainerRef = useRef<View>(null);

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
    const { x, y } = gridToScreen(row, col, GRID_SIZE);
    const scrollX = Math.max(0, x - SCREEN_W / 2);
    const scrollY = Math.max(0, y - SCREEN_H / 2);
    scrollRef.current?.scrollTo({ x: scrollX, y: scrollY, animated: true });
  }, []);

  // Called when a building is selected in the registry
  const handleRegistrySelect = useCallback((building: Building) => {
    setShowRegistry(false);
    setHighlightedBuildingId(building.id);
    scrollToBuilding(building.position.row, building.position.col);
  }, [scrollToBuilding]);

  const handleCellPress = (row: number, col: number) => {
    // Bounds check
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

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

    // Trophy placement mode
    if (placingTrophy) {
      const hasTrophy = gameState.trophies.some(
        tr => tr.gridPosition?.x === col && tr.gridPosition?.y === row,
      );
      if (!hasTrophy) {
        store.placeTrophy(placingTrophy.id, { x: col, y: row });
        setPlacingTrophy(null);
      }
      return;
    }

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

  // Handle tap on the SVG canvas area — proper diamond hit-testing
  // SVG is centered in the larger container — offset = (containerSize - canvasSize) / 2
  const SVG_OFFSET_X = Math.round((CANVAS_W * 25 / 15 - CANVAS_W) / 2);
  const SVG_OFFSET_Y = Math.round((CANVAS_H * 25 / 15 - CANVAS_H) / 2);
  const handleMapPress = useCallback((event: GestureResponderEvent) => {
    // Use pageX/pageY and measure the container position for accurate hit detection
    const { locationX, locationY } = event.nativeEvent;
    // locationX/Y is relative to the responder view (the container), which is correct
    // Subtract SVG offset to get SVG-local coordinates
    const svgX = locationX - SVG_OFFSET_X;
    const svgY = locationY - SVG_OFFSET_Y;

    // Ignore taps outside the SVG area
    if (svgX < 0 || svgY < 0 || svgX > CANVAS_W || svgY > CANVAS_H) return;

    // Debug: log tap coordinates (remove after hitbox fix confirmed)
    console.log(`[TAP] loc(${Math.round(locationX)},${Math.round(locationY)}) svg(${Math.round(svgX)},${Math.round(svgY)})`);

    // First pass: use screenToGrid to get approximate cell
    const { row: rawRow, col: rawCol } = screenToGrid(svgX, svgY, GRID_SIZE);
    const approxRow = rawRow;
    const approxCol = rawCol;

    // Second pass: diamond hit-test the approximate cell and its neighbors
    // (screenToGrid can be off by 1 near tile edges)
    let bestRow = approxRow;
    let bestCol = approxCol;
    let found = false;
    for (let dr = -1; dr <= 1 && !found; dr++) {
      for (let dc = -1; dc <= 1 && !found; dc++) {
        const testRow = approxRow + dr;
        const testCol = approxCol + dc;
        if (testRow < 0 || testRow >= GRID_SIZE || testCol < 0 || testCol >= GRID_SIZE) continue;
        const { x, y } = gridToScreen(testRow, testCol, GRID_SIZE);
        if (isTapInDiamond(svgX, svgY, x, y)) {
          bestRow = testRow;
          bestCol = testCol;
          found = true;
        }
      }
    }

    // Clamp to valid grid bounds
    const row = Math.max(0, Math.min(GRID_SIZE - 1, bestRow));
    const col = Math.max(0, Math.min(GRID_SIZE - 1, bestCol));
    handleCellPress(row, col);
  }, [gameState, obstacles, buildPlacementMode, placingTrophy, highlightedBuildingId]);

  const activeZone = gameState.zones.find(z => zoneIsExploring(z));
  const isWaveApproaching = activeWave != null && (activeWave.status === 'approaching' || activeWave.status === 'active');
  const currentDefenseVP = store.calculateDefense().totalVP;
  const stallBuilding = gameState.buildings.find(b => b.type === BuildingType.stall && b.level >= 1) ?? null;

  // ── Render isometric grid rows (painter's algorithm: back to front) ─────
  const renderGridTiles = useMemo(() => {
    const elements: React.ReactElement[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const { x, y } = gridToScreen(row, col, GRID_SIZE);
        const building = gameState.buildings.find(b => b.position.row === row && b.position.col === col);
        const obstacle = obstacles.find(o => o.row === row && o.col === col && !o.isCleared);
        const isPlacementTarget = (buildPlacementMode != null || placingTrophy != null) && !building && !obstacle;
        const trophyHere = !building && gameState.trophies.find(
          tr => tr.gridPosition?.x === col && tr.gridPosition?.y === row,
        );
        const isHighlighted = building != null && highlightedBuildingId === building.id;

        // Base tile
        elements.push(
          <IsometricTile
            key={`tile-${row}-${col}`}
            x={x}
            y={y}
            variant={isHighlighted ? 'highlight' : isPlacementTarget ? 'highlight' : 'grass'}
          />
        );

        // Building
        if (building) {
          elements.push(
            <IsometricBuilding
              key={`bld-${row}-${col}`}
              x={x}
              y={y}
              buildingType={building.type}
              level={building.level}
              isUnderConstruction={building.isUnderConstruction}
            />
          );
        } else if (obstacle) {
          elements.push(
            <ObstacleSvg
              key={`obs-${row}-${col}`}
              x={x}
              y={y}
              type={obstacle.type}
              isClearing={obstacle.isClearing}
            />
          );
        } else if (trophyHere) {
          elements.push(
            <TrophySvg
              key={`trophy-${row}-${col}`}
              x={x}
              y={y}
              emoji={trophyHere.emoji}
            />
          );
        } else if (isPlacementTarget) {
          elements.push(
            <PlacementIndicator key={`place-${row}-${col}`} x={x} y={y} />
          );
        }
      }
    }

    return elements;
  }, [gameState.buildings, gameState.trophies, obstacles, buildPlacementMode, placingTrophy, highlightedBuildingId]);

  // Centre the scroll on initial mount
  const initialScrollX = Math.max(0, (CANVAS_W - SCREEN_W) / 2);
  const initialScrollY = Math.max(0, (CANVAS_H - SCREEN_H) / 2);

  // Shared values for parallax scroll tracking
  const parallaxScrollX = useSharedValue(0);
  const parallaxScrollY = useSharedValue(0);

  return (
    <View style={styles.container}>
      {/* World Map — Single ScrollView for smooth bidirectional pan + zoom */}
      <ScrollView
        ref={scrollRef}
        style={styles.mapScroll}
        contentContainerStyle={{
          width: Math.round(CANVAS_W * 25 / 15) + 200,
          height: Math.round(CANVAS_H * 25 / 15) + 400,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        horizontal
        directionalLockEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: initialScrollX, y: initialScrollY }}
        maximumZoomScale={2.5}
        minimumZoomScale={0.25}
        bouncesZoom
        bounces
        scrollEnabled
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const { contentOffset } = e.nativeEvent;
          parallaxScrollX.value = contentOffset.x - initialScrollX;
          parallaxScrollY.value = contentOffset.y - initialScrollY;
        }}
      >
        <View
          ref={svgContainerRef}
          style={{
            width: Math.round(CANVAS_W * 25 / 15),
            height: Math.round(CANVAS_H * 25 / 15),
            position: 'relative',
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => false}
          onResponderRelease={handleMapPress}
        >
          {/* Layer 1: SVG grid tiles + buildings (bottom layer) */}
          <Svg
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{
              position: 'absolute',
              top: Math.round((CANVAS_H * 25 / 15 - CANVAS_H) / 2),
              left: Math.round((CANVAS_W * 25 / 15 - CANVAS_W) / 2),
            }}
          >
            {renderGridTiles}
          </Svg>

          {/* Layer 2: Forest PNG ON TOP — transparent center shows tiles through,
              tree edges naturally overlap the playfield border = correct depth */}
          <ForestParallax
            canvasWidth={CANVAS_W}
            canvasHeight={CANVAS_H}
            scrollX={parallaxScrollX}
            scrollY={parallaxScrollY}
          />
        </View>
      </ScrollView>

      {/* Danger overlay — red border when wave approaching */}
      {isWaveApproaching && (
        <View style={styles.dangerOverlay} pointerEvents="none" />
      )}

      {/* Monster silhouettes when approaching */}
      {isWaveApproaching && activeWave && (
        <View style={styles.monsterRing} pointerEvents="none">
          {activeWave.monsters.slice(0, 3).map((m, i) => (
            <Text key={i} style={[styles.monsterEmojiOverlay, { left: `${20 + i * 30}%` as unknown as number }]}>
              {MONSTER_CONFIGS[m.type].emoji}
            </Text>
          ))}
        </View>
      )}

      {/* Trophy placement banner */}
      {placingTrophy && (
        <View style={styles.placementBanner}>
          <Text style={styles.placementText}>
            {placingTrophy.emoji} Trophäe platzieren — tippe auf ein leeres Feld
          </Text>
          <TouchableOpacity onPress={() => setPlacingTrophy(null)}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      )}

      {/* HUD Top */}
      <View style={styles.hudTop}>
        <TopResourceBar onResourcePress={setSelectedResource} />

        {/* Wall HP bar */}
        {gameState.wallHP && gameState.wallHP.max > 0 && (() => {
          const pct = gameState.wallHP.current / gameState.wallHP.max;
          const hpColor = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FF9800' : '#F44336';
          return (
            <TouchableOpacity
              style={styles.wallHPBar}
              onPress={() => {
                if (!gameState.wallHP) return;
                const missingHP = gameState.wallHP.max - gameState.wallHP.current;
                if (missingHP <= 0) return;
                const mauerBuilding = gameState.buildings.find(b => b.type === 'mauer' && b.level >= 1 && !b.isUnderConstruction);
                if (!mauerBuilding) return;
                const repairCost = Math.ceil(missingHP * 20 / gameState.wallHP.max * mauerBuilding.level);
                Alert.alert(
                  'Mauer reparieren',
                  `Reparaturkosten: ${repairCost} Holz\nAktuell: ${Math.floor(gameState.wood)} Holz`,
                  [
                    { text: 'Abbrechen', style: 'cancel' },
                    {
                      text: `Reparieren (${repairCost} Holz)`,
                      onPress: () => {
                        if (gameState.wood >= repairCost) {
                          store.repairWall();
                        } else {
                          Alert.alert('Nicht genug Holz', `Du brauchst ${repairCost} Holz.`);
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={styles.wallHPLabel}>🧱</Text>
              <View style={styles.wallHPTrack}>
                <View style={[styles.wallHPFill, { width: `${pct * 100}%` as unknown as number, backgroundColor: hpColor }]} />
              </View>
              <Text style={styles.wallHPText}>{gameState.wallHP.current}/{gameState.wallHP.max}</Text>
            </TouchableOpacity>
          );
        })()}

        {activeWave && (activeWave.status === 'approaching' || activeWave.status === 'active') && (
          <WaveBanner
            wave={activeWave}
            defenseVP={currentDefenseVP}
            isBloodWave={waveService.isBloodWaveDue(gameState.lastBloodWaveAt)}
            onDetails={() => setWaveDetailVisible(true)}
            onPrepare={() => { if (stallBuilding) setSelectedStall(stallBuilding); }}
          />
        )}
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
          <TouchableOpacity style={styles.hudBtn} onPress={() => setShowDefense(true)}>
            <Ionicons name="shield-checkmark" size={28} color="#E879F9" />
            <Text style={styles.hudBtnLabel}>{t('hud.defense')}</Text>
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

      {/* Wave Result Sheet */}
      {pendingWaveResult && (
        <WaveResultSheet
          visible={!!pendingWaveResult}
          wave={pendingWaveResult.wave}
          result={pendingWaveResult.result}
          defenseVP={pendingWaveResult.defenseVP}
          effectiveAK={pendingWaveResult.effectiveAK}
          damages={pendingWaveResult.damages}
          loot={pendingWaveResult.loot}
          nextWaveIn={pendingWaveResult.nextWaveIn}
          onClose={clearPendingWaveResult}
        />
      )}

      {/* Wave Detail Sheet */}
      {activeWave && (
        <WaveDetailSheet
          visible={waveDetailVisible}
          wave={activeWave}
          defense={store.calculateDefense()}
          onClose={() => setWaveDetailVisible(false)}
        />
      )}

      {/* Egg Hatch Modal */}
      {pendingHatchResult && (
        <EggHatchModal
          visible={!!pendingHatchResult}
          animalType={pendingHatchResult.animalType}
          rarity={pendingHatchResult.rarity}
          onClose={clearPendingHatchResult}
        />
      )}

      {/* Dragon Unlock Modal */}
      <DragonUnlockModal
        visible={pendingDragonUnlock}
        onClose={clearPendingDragonUnlock}
      />

      {/* Defense Dashboard Modal */}
      <DefenseDashboardModal
        visible={showDefense}
        onClose={() => setShowDefense(false)}
      />

      {/* Nothing-to-collect toast */}
      {toastMessage && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

// MARK: - Color helpers
function toFullHex(color: string): string {
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  return color;
}

// MARK: - Construction countdown helper
function fmtConstructionTime(endsAt: number | null): string | null {
  if (!endsAt) return null;
  const rem = Math.max(0, (endsAt - Date.now()) / 1000);
  if (rem <= 0) return null;
  return formatDuration(Math.floor(rem));
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

  const woodRatio  = cap.wood  > 0 && cap.wood  !== Infinity ? gs.wood  / cap.wood  : 0;
  const stoneRatio = cap.stone > 0 && cap.stone !== Infinity ? gs.stone / cap.stone : 0;
  const foodRatio  = cap.food  > 0 && cap.food  !== Infinity ? gs.food  / cap.food  : 0;
  const woodColor  = woodRatio  >= 1 ? '#FF5252' : woodRatio  >= 0.8 ? '#FF9800' : '#A0826D';
  const stoneColor = stoneRatio >= 1 ? '#FF5252' : stoneRatio >= 0.8 ? '#FF9800' : '#9E9E9E';
  const foodColor  = foodRatio  >= 1 ? '#FF5252' : foodRatio  >= 0.8 ? '#FF9800' : '#4CAF50';

  if (collapsed) {
    return (
      <TouchableOpacity style={styles.collapsedPill} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.collapsedIconGroup}>
          <Ionicons name="barbell" size={18} color={AppColors.gold} />
          <MaterialCommunityIcons name="diamond-stone" size={18} color="#00BCD4" />
        </View>
        <View style={styles.collapsedSep} />
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

        <TouchableOpacity onPress={toggle} style={styles.collapseBtn} activeOpacity={0.6}>
          <Ionicons name="chevron-up" size={14} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>

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
  max: number;
  onPress: () => void;
  lang: string;
}

function ResourceBarRow({ icon, iconColor, label, current, max, onPress, lang }: ResourceBarRowProps) {
  const hasCap   = max > 0;
  const ratio    = hasCap ? Math.min(current / max, 1) : 0;
  const isFull   = hasCap && ratio >= 1.0;
  const isAlmost = hasCap && ratio >= 0.8 && !isFull;

  const [containerW, setContainerW] = useState(0);
  const fillAnim   = useSharedValue(0);
  const glowAnim   = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [ratio]);

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
  const maxStr     = hasCap ? fmtNum(max, lang) : '\u221E';
  const currentStr = fmtNum(current, lang);

  return (
    <TouchableOpacity style={styles.barRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.barIconWrap, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={13} color={iconColor} />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
      <View
        style={styles.barTrack}
        onLayout={e => setContainerW(e.nativeEvent.layout.width)}
      >
        <View style={[styles.barTrackBg]} />
        <Animated.View style={[styles.barFill, { backgroundColor: barColor }, fillStyle]} />
        {(isFull || isAlmost) && (
          <Animated.View style={[styles.barGlow, { backgroundColor: barColor }, glowStyle]} />
        )}
      </View>
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
  dangerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 3,
    borderColor: 'rgba(239,83,80,0.4)',
    zIndex: 5,
    pointerEvents: 'none',
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
  hudBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  hudBtnLabel: { fontSize: 12, color: '#fff', marginTop: 4 },
  resourceBar: { gap: 6 },

  // Collapsed pill
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

  // Currency card
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

  // Resource bars card
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
  wallHPBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(26,26,46,0.88)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    marginTop: 4, marginHorizontal: 8,
  },
  wallHPLabel: { fontSize: 14 },
  wallHPTrack: {
    flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4, overflow: 'hidden',
  },
  wallHPFill: { height: '100%', borderRadius: 4 },
  wallHPText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', minWidth: 44, textAlign: 'right' },
  monsterRing: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    height: 40,
    pointerEvents: 'none',
  },
  monsterEmojiOverlay: {
    position: 'absolute',
    fontSize: 28,
    bottom: 0,
  },
});
