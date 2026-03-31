// RealmScreen.tsx
// FitRealm - Realm tab: isometric 2.5D world map with HUD overlay and sheets

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  Dimensions, LayoutAnimation, UIManager, Platform, Alert,
  GestureResponderEvent, AppState,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withRepeat, withDelay, Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  buildingAccentColor,
  obstacleIsSmall, obstacleRemovalCost,
  workerStatus, WorkerStatus,
  zoneIsExploring,
} from '../models/types';
import { WorldConstants, WALL_REPAIR_COST_FACTOR } from '../config/GameConfig';
import { getBuildingLevelConfig } from '../config/GameConfigHelpers';
import { buildingProducesResource, ResourceType } from '../models/types';
import { canBuild } from '../engines/GameEngine';
import { formatDuration } from '../utils/formatDuration';
import { gridToScreen, screenToGrid, getGridPixelSize, isTapInDiamond, TILE_W, TILE_H, TILE_DEPTH } from '../utils/isometric';
import IsometricTile from '../components/IsometricTile';
import IsometricBuilding from '../components/IsometricBuilding';
import { ForestParallax } from '../components/village/ForestParallax';
import { ResourceBubble } from '../components/village/ResourceBubble';
import { BuildingSpriteOverlay } from '../components/BuildingSpriteOverlay';
// import { PlayfieldAnimals } from '../components/village/PlayfieldAnimals';
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
import { MONSTER_CONFIGS } from '../config/GameConfig';
import { waveService } from '../services/WaveService';
import { Trophy } from '../models/types';
import { BiomeId } from '../features/exploration/types';
import { BIOME_CONFIGS } from '../features/exploration/biomeConfig';
import { useExplorationStore } from '../features/exploration/useExplorationStore';
import { SendScoutModal } from '../components/exploration/SendScoutModal';
import { ScoutReportModal } from '../components/exploration/ScoutReportModal';

const GRID_SIZE = WorldConstants.gridSize; // 15
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Canvas = just the 15x15 playfield SVG grid.
const CANVAS_SIZE = getGridPixelSize(GRID_SIZE);
const CANVAS_W = CANVAS_SIZE.width;
const CANVAS_H = CANVAS_SIZE.height;

// World PNG is 6144x4010. Grid occupies 22% width, center at (56.6%, 43.8%).
// Container is sized so SVG grid (CANVAS_W) matches the grid area in the image.
// The image fills the container at native resolution via resizeMode="cover".
const WORLD_ASPECT = 6144 / 4010;               // ~1.532
const GRID_WIDTH_FRAC = 0.2197;                  // grid is 22% of image width
const GRID_CENTER_X_FRAC = 0.5659;              // grid center at 56.6% from left
const GRID_CENTER_Y_FRAC = 0.4378;              // grid center at 43.8% from top

// Container sized so the SVG grid area matches the grid in the PNG
const CONTAINER_W = Math.round(CANVAS_W / GRID_WIDTH_FRAC);
const CONTAINER_H = Math.round(CONTAINER_W / WORLD_ASPECT);

// SVG grid offset: position grid at exact pixel location matching the PNG
const SVG_OFFSET_X = Math.round(CONTAINER_W * GRID_CENTER_X_FRAC - CANVAS_W / 2);
const SVG_OFFSET_Y = Math.round(CONTAINER_H * GRID_CENTER_Y_FRAC - CANVAS_H / 2);

// Zoom scale constants
const MIN_SCALE = 0.35;
const MAX_SCALE = 1.5;
const INITIAL_SCALE = 0.55;


// ── Biome Lock Icon ────────────────────────────────────────────────────────
function BiomeLockIcon({ left, top, emoji, label, status, onPress }: {
  left: number; top: number; emoji: string; label: string;
  status: 'locked' | 'scouting' | 'scout_returned' | 'unlocking' | 'unlocked';
  onPress: () => void;
}) {
  const pulse = useSharedValue(1);
  const isReturned = status === 'scout_returned';
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(isReturned ? 1.18 : 1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ), -1, false
    );
  }, [isReturned]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (status === 'unlocked') return null;

  const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
    status === 'scouting' ? 'paw' :
    status === 'scout_returned' ? 'email' :
    status === 'unlocking' ? 'lock-open-variant' : 'lock';
  const borderColor = isReturned ? '#FFD700' : '#FFD700';
  const glowStyle = isReturned ? { shadowColor: '#FFD700', shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 } : {};

  return (
    <Animated.View style={[{
      position: 'absolute', left, top, width: 56, height: 56,
      alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }, pulseStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderWidth: 2, borderColor,
          alignItems: 'center', justifyContent: 'center',
        }, glowStyle]}
      >
        <MaterialCommunityIcons name={iconName} size={20} color="#FFD700" />
        <Text style={{ fontSize: 7, color: '#FFD700', fontWeight: 'bold', marginTop: 1 }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  // Exploration state
  const biomes = useExplorationStore(s => s.biomes);
  const checkReturnedScouts = useExplorationStore(s => s.checkReturnedScouts);
  const [scoutModal, setScoutModal] = useState<BiomeId | null>(null);
  const [reportModal, setReportModal] = useState<BiomeId | null>(null);

  useEffect(() => {
    checkReturnedScouts();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') checkReturnedScouts(); });
    return () => sub.remove();
  }, []);

  // Scroll ref for map navigation
  const scrollRef = useRef<ScrollView>(null);
  // Initial scroll position (set by Rathaus-centering useEffect, used for parallax delta)
  const initialScrollPos = useRef({ x: 0, y: 0 });
  // Track the SVG container layout position for touch conversion
  const svgLayoutRef = useRef({ pageX: 0, pageY: 0 });
  const svgContainerRef = useRef<Animated.View>(null);

  useEffect(() => {
    store.processTick();
    store.checkObstacleCompletion();
  }, []);

  // Centre camera on Rathaus at startup.
  // contentContainerStyle is exactly containerW × containerH — no extra padding,
  // no alignItems/justifyContent centering — so the Animated.View sits at (0, 0).
  // transform:scale(INITIAL_SCALE) pivots around the Animated.View centre:
  //   visualX = containerW/2 + (animX - containerW/2) * scale
  //   visualY = containerH/2 + (animY - containerH/2) * scale
  useEffect(() => {
    const rathaus = gameState.buildings.find(b => b.type === BuildingType.rathaus);
    if (!rathaus) return;
    const { x, y } = gridToScreen(rathaus.position.row, rathaus.position.col, GRID_SIZE);
    // Rathaus tile centre in Animated.View space
    const animX = SVG_OFFSET_X + x + TILE_W / 2;
    const animY = SVG_OFFSET_Y + y + TILE_H / 2;
    // Visual position in content space — scale pivots on Animated.View centre
    const visualX = CONTAINER_W / 2 + (animX - CONTAINER_W / 2) * INITIAL_SCALE;
    const visualY = CONTAINER_H / 2 + (animY - CONTAINER_H / 2) * INITIAL_SCALE;
    const targetX = Math.max(0, visualX - SCREEN_W / 2);
    const targetY = Math.max(0, visualY - SCREEN_H / 2);
    initialScrollPos.current = { x: targetX, y: targetY };
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetX, y: targetY, animated: false });
    }, 50);
  }, []);

  // Clear highlight after 1.5 s
  useEffect(() => {
    if (!highlightedBuildingId) return;
    const timer = setTimeout(() => setHighlightedBuildingId(null), 1500);
    return () => clearTimeout(timer);
  }, [highlightedBuildingId]);

  // Pinch-to-zoom shared values — declared here so scrollToBuilding can read scale.value
  const scale = useSharedValue(INITIAL_SCALE);
  const savedScale = useSharedValue(INITIAL_SCALE);

  // Vertical offset (in Animated.View px, before scale) to shift the camera
  // above the tile centre so the building SPRITE — not the floor tile — is centred.
  // PNG sprites are bottom-anchored; SVG cuboids also extend upward from the tile.
  // All sprites are now uniformly sized (TILE_W). A single offset shifts the
  // camera above the tile centre so the building body is visible.
  const getSpriteVerticalOffset = (_type: BuildingType): number => -35;

  // Scroll map so the building sprite sits at viewport centre.
  // contentContainerStyle has zero extra padding — Animated.View is at (0, 0).
  // transform:scale pivots around the Animated.View centre:
  //   visualX = containerW/2 + (animX - containerW/2) * currentScale
  // We read scale.value (current zoom level) so the target is correct even
  // after the user has pinched to zoom before opening the registry.
  // A per-type sprite offset shifts Y above the tile floor so the player
  // sees the building body rather than just its base tile.
  const scrollToBuilding = useCallback((row: number, col: number, buildingType: BuildingType) => {
    const { x, y } = gridToScreen(row, col, GRID_SIZE);
    // Building visual centre in Animated.View space (Y shifted up to show sprite body)
    const spriteOffset = getSpriteVerticalOffset(buildingType);
    const animX = SVG_OFFSET_X + x + TILE_W / 2;
    const animY = SVG_OFFSET_Y + y + TILE_H / 2 + spriteOffset;
    // Use current zoom level — correct even if user has pinched before opening registry
    const currentScale = scale.value;
    // Visual position in content space — scale pivots on Animated.View centre
    const visualX = CONTAINER_W / 2 + (animX - CONTAINER_W / 2) * currentScale;
    const visualY = CONTAINER_H / 2 + (animY - CONTAINER_H / 2) * currentScale;
    scrollRef.current?.scrollTo({
      x: Math.max(0, visualX - SCREEN_W / 2),
      y: Math.max(0, visualY - SCREEN_H / 2),
      animated: true,
    });
  }, [scale]);

  // Called when a building is selected in the registry
  const handleRegistrySelect = useCallback((building: Building) => {
    setShowRegistry(false);
    setHighlightedBuildingId(building.id);
    scrollToBuilding(building.position.row, building.position.col, building.type);
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
          setToastMessage(t('realm.stallFirstAnimal'));
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    }
  };

  // ── Sprite-based hit-test: check if tap lands on a building's PNG sprite ────
  // Must match the positioning formula in BuildingSpriteOverlay exactly.
  const findBuildingBySpriteTap = useCallback((svgX: number, svgY: number): Building | null => {
    const size = TILE_W; // UNIFORM_SCALE = 1.0
    const BOTTOM_PAD_FRAC = 0.12; // must match BuildingSpriteOverlay

    // Tight hitbox: only the visible building area + ~10% tolerance.
    // Buildings occupy roughly the centre 60% of the PNG width and
    // the lower ~70% of its height.  Adding ~10% margin on every side:
    //   width  = 70% of size  (centred horizontally)
    //   height = 80% of size  (bottom-aligned with the sprite)
    const HIT_W = size * 0.70;
    const HIT_H = size * 0.80;

    // Sort by depth (front buildings first) so overlapping sprites pick the visible one
    const sorted = [...gameState.buildings]
      .filter(b => !b.isUnderConstruction)
      .sort((a, b) => (b.position.row + b.position.col) - (a.position.row + a.position.col));

    for (const building of sorted) {
      const { x, y } = gridToScreen(building.position.row, building.position.col, GRID_SIZE);
      // svgX/svgY are relative to the SVG wrapper view — do NOT add SVG_OFFSET here
      const spriteLeft = x + TILE_W / 2 - size / 2;
      const spriteTop  = y + TILE_H - size + size * BOTTOM_PAD_FRAC;

      // Tight rect: centred horizontally, bottom-aligned with sprite
      const hitLeft   = spriteLeft + (size - HIT_W) / 2;
      const hitTop    = spriteTop  + (size - HIT_H);
      const hitRight  = hitLeft + HIT_W;
      const hitBottom = spriteTop  + size;

      if (svgX >= hitLeft && svgX <= hitRight && svgY >= hitTop && svgY <= hitBottom) {
        return building;
      }
    }
    return null;
  }, [gameState.buildings]);

  // Handle tap on the SVG canvas area — sprite hit-test first, then diamond fallback
  const handleSvgPress = useCallback((event: GestureResponderEvent) => {
    const { locationX: svgX, locationY: svgY } = event.nativeEvent;

    // ── In placement mode, skip sprite hit-test — use grid logic only ──
    if (!buildPlacementMode && !placingTrophy) {
      const spriteTapped = findBuildingBySpriteTap(svgX, svgY);
      if (spriteTapped) {
        if (spriteTapped.type === BuildingType.stall && spriteTapped.level >= 1) {
          setSelectedStall(spriteTapped);
        } else {
          setSelectedBuilding(spriteTapped);
        }
        return;
      }
    }

    // ── Fallback: diamond hit-test on the ground tile ──
    const { row: rawRow, col: rawCol } = screenToGrid(svgX, svgY, GRID_SIZE);
    const approxRow = rawRow;
    const approxCol = rawCol;

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

    const row = Math.max(0, Math.min(GRID_SIZE - 1, bestRow));
    const col = Math.max(0, Math.min(GRID_SIZE - 1, bestCol));
    handleCellPress(row, col);
  }, [gameState, obstacles, buildPlacementMode, placingTrophy, highlightedBuildingId, findBuildingBySpriteTap]);

  const activeZone = gameState.zones.find(z => zoneIsExploring(z));
  const isWaveApproaching = activeWave != null && (activeWave.status === 'approaching' || activeWave.status === 'active');
  const currentDefenseVP = store.calculateDefense().totalVP;
  const stallBuilding = gameState.buildings.find(b => b.type === BuildingType.stall && b.level >= 1) ?? null;

  // ── Render isometric grid rows (painter's algorithm: back to front) ─────
  // Tile layer — re-renders when highlights or placement mode changes.
  // Tiles are transparent so separating them from buildings causes no z-order issues.
  // showGrid: grid lines hidden by default, shown only in build/trophy placement mode.
  const showGrid = buildPlacementMode !== null || placingTrophy !== null;

  const tileLayer = useMemo(() => {
    const elements: React.ReactElement[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const { x, y } = gridToScreen(row, col, GRID_SIZE);
        const building = gameState.buildings.find(b => b.position.row === row && b.position.col === col);
        const obstacle = obstacles.find(o => o.row === row && o.col === col && !o.isCleared);
        const isPlacementTarget = (buildPlacementMode != null || placingTrophy != null) && !building && !obstacle;
        const isHighlighted = building != null && highlightedBuildingId === building.id;
        elements.push(
          <IsometricTile
            key={`tile-${row}-${col}`}
            x={x}
            y={y}
            variant={isHighlighted ? 'highlight' : isPlacementTarget ? 'highlight' : 'grass'}
            showGrid={showGrid}
          />
        );
      }
    }
    return elements;
  }, [gameState.buildings, obstacles, buildPlacementMode, placingTrophy, highlightedBuildingId, showGrid]);

  // Building/obstacle/trophy layer — re-renders when game content changes.
  // Does NOT depend on showGrid so the tile memo fires independently.
  const buildingLayer = useMemo(() => {
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
        if (building) {
          if (building.isUnderConstruction) {
            // Construction scaffold only — completed buildings handled by BuildingSpriteOverlay
            elements.push(
              <IsometricBuilding
                key={`bld-${row}-${col}`}
                x={x}
                y={y}
                buildingType={building.type}
                level={building.level}
                isUnderConstruction={true}
              />
            );
          }
          // Completed buildings: PNG rendered by BuildingSpriteOverlay (Layer 2)
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

  // Tiles occupied by buildings (animals won't walk there)
  const occupiedTiles = useMemo(() => {
    const set = new Set<string>();
    for (const b of gameState.buildings) set.add(`${b.position.row},${b.position.col}`);
    return set;
  }, [gameState.buildings]);

  // Buildings that are currently producing AND have enough storage to show a bubble.
  // Only resource-producing buildings (holzfaeller, steinbruch, feld, proteinfarm).
  // Threshold: currentStorage >= 5 % of maxStorage at that level.
  const collectableBuildings = useMemo(() => {
    return gameState.buildings.filter(b => {
      if (b.isUnderConstruction || b.level < 1) return false;
      const rt = buildingProducesResource(b.type);
      if (rt === ResourceType.none) return false;
      if (b.currentStorage <= 0) return false;
      const lvlCfg = getBuildingLevelConfig(b.type, b.level);
      const maxStorage = lvlCfg?.maxStorage ?? 100;
      return b.currentStorage >= maxStorage * 0.05;
    });
  }, [gameState.buildings]);

  // SVG offset within the container (for positioning overlays)
  const svgOffsetX = SVG_OFFSET_X;
  const svgOffsetY = SVG_OFFSET_Y;

  // Shared values for parallax scroll tracking
  const parallaxScrollX = useSharedValue(0);
  const parallaxScrollY = useSharedValue(0);

  // Zoom is handled entirely by ScrollView's built-in maximumZoomScale/minimumZoomScale.
  // No manual pinch gesture — avoids conflict with ScrollView zoom that causes drift.
  const zoomStyle = useAnimatedStyle(() => ({
    // No transform — ScrollView handles zoom natively
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* World Map — ScrollView with both directions via horizontal+scrollEnabled */}
      <ScrollView
        ref={scrollRef}
        style={styles.mapScroll}
        contentContainerStyle={{
          width: CONTAINER_W,
          height: CONTAINER_H,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces
        scrollEnabled
        directionalLockEnabled={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        maximumZoomScale={2.5}
        minimumZoomScale={0.35}
        bouncesZoom
        onScroll={(e) => {
          const { contentOffset } = e.nativeEvent;
          parallaxScrollX.value = contentOffset.x - initialScrollPos.current.x;
          parallaxScrollY.value = contentOffset.y - initialScrollPos.current.y;
        }}
      >
            <View
              ref={svgContainerRef}
              style={{
                width: CONTAINER_W,
                height: CONTAINER_H,
                position: 'relative',
              }}
            >
            {/* SVG wrapper — tap handler is HERE so locationX/Y = SVG coordinates directly */}
            <View
              style={{
                position: 'absolute',
                top: SVG_OFFSET_Y,
                left: SVG_OFFSET_X,
                width: CANVAS_W,
                height: CANVAS_H,
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => false}
              onResponderRelease={handleSvgPress}
            >
              <Svg
                width={CANVAS_W}
                height={CANVAS_H}
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              >
                {tileLayer}
                {buildingLayer}
              </Svg>
            </View>

            {/* Layer 2: Building sprites — PNG for rathaus/holzfaeller, SVG for all others */}
            <BuildingSpriteOverlay
              buildings={gameState.buildings}
              gridSize={GRID_SIZE}
              svgOffsetX={svgOffsetX}
              svgOffsetY={svgOffsetY}
            />

            {/* Layer 3: Animated farm animals — disabled for now */}

            {/* Layer 4: Resource collection bubbles — float above buildings */}
            {collectableBuildings.map(building => {
              const { x, y } = gridToScreen(building.position.row, building.position.col, GRID_SIZE);
              // Anchor to the tile's top diamond vertex (y) + small fixed offset.
              // This gives a consistent position for ALL building heights:
              //   flat feld  → bubble sits just above the building sprite
              //   tall Rathaus → bubble appears near the lower-third of the sprite
              // The diamond top vertex IS the topmost pixel of the isometric tile.
              const bubbleX = SVG_OFFSET_X + x + TILE_W / 2;
              const bubbleY = SVG_OFFSET_Y + y - 15;
              return (
                <ResourceBubble
                  key={`bubble-${building.id}`}
                  resourceType={buildingProducesResource(building.type)}
                  amount={building.currentStorage}
                  x={bubbleX}
                  y={bubbleY}
                  visible={true}
                  onCollect={() => store.collectResources(building.id)}
                />
              );
            })}

            {/* Layer 5: Forest PNG ON TOP — transparent center shows tiles through,
                tree edges naturally overlap the playfield border = correct depth */}
            <ForestParallax
              containerWidth={CONTAINER_W}
              containerHeight={CONTAINER_H}
              scrollX={parallaxScrollX}
              scrollY={parallaxScrollY}
            />

            {/* Layer 6: Biome lock icons — positioned at transition points */}
            <BiomeLockIcon
              left={Math.round(CONTAINER_W * 0.4743) - 28}
              top={Math.round(CONTAINER_H * 0.3568) - 28}
              emoji="🏜️"
              label="Wüste"
              status={biomes.desert.status}
              onPress={() => {
                const s = biomes.desert.status;
                if (s === 'scout_returned') setReportModal('desert');
                else if (s === 'unlocking') setReportModal('desert');
                else if (s === 'locked') setScoutModal('desert');
                else if (s === 'scouting') setScoutModal('desert');
              }}
            />
            <BiomeLockIcon
              left={Math.round(CONTAINER_W * 0.6574) - 28}
              top={Math.round(CONTAINER_H * 0.5188) - 28}
              emoji="⛰️"
              label="Berge"
              status={biomes.mountains.status}
              onPress={() => {
                const s = biomes.mountains.status;
                if (s === 'scout_returned') setReportModal('mountains');
                else if (s === 'unlocking') setReportModal('mountains');
                else if (s === 'locked') setScoutModal('mountains');
                else if (s === 'scouting') setScoutModal('mountains');
              }}
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
            {t('realm.trophyPlaceHint', { emoji: placingTrophy.emoji })}
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
                const repairCost = Math.ceil(missingHP * WALL_REPAIR_COST_FACTOR / gameState.wallHP.max * mauerBuilding.level);
                Alert.alert(
                  t('wall.repairTitle'),
                  t('wall.repairCostMessage', { cost: repairCost, wood: Math.floor(gameState.wood) }),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('wall.repairButton', { cost: repairCost }),
                      onPress: () => {
                        if (gameState.wood >= repairCost) {
                          store.repairWall();
                        } else {
                          Alert.alert(t('wall.notEnoughTitle'), t('wall.notEnoughBody', { cost: repairCost }));
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

      {/* HUD Bottom — collect button above bar + main bar */}
      <View style={styles.hudBottom}>
        {/* Collect button — small pill above the main bar */}
        <TouchableOpacity
          style={styles.collectPill}
          activeOpacity={0.75}
          onPress={() => {
            const result = store.collectAll();
            if (result.totalBuildings === 0) {
              setToastMessage(t('collect.nothingToCollect'));
              setTimeout(() => setToastMessage(null), 2000);
            }
          }}
        >
          <Ionicons name="download-outline" size={16} color="#00C853" />
          <Text style={styles.collectPillText}>{t('hud.collect')}</Text>
        </TouchableOpacity>

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
            if (stallBuilding) {
              setSelectedStall(stallBuilding);
            } else {
              setToastMessage('Baue zuerst einen Stall!');
              setTimeout(() => setToastMessage(null), 2500);
            }
          }}>
            <MaterialCommunityIcons name="paw" size={28} color="#C4934A" />
            <Text style={styles.hudBtnLabel}>Tiere</Text>
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

      {/* Exploration Modals */}
      {(['desert', 'mountains'] as BiomeId[]).map(id => (
        <React.Fragment key={`exploration-${id}`}>
          <SendScoutModal biomeId={id} visible={scoutModal === id} onClose={() => setScoutModal(null)} />
          <ScoutReportModal biomeId={id} visible={reportModal === id} onClose={() => setReportModal(null)} />
        </React.Fragment>
      ))}
    </GestureHandlerRootView>
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
  collectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(37, 37, 71, 0.85)',
    borderRadius: 16, paddingVertical: 6, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(0, 200, 83, 0.3)',
  },
  collectPillText: { fontSize: 12, fontWeight: '600', color: '#00C853' },
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
