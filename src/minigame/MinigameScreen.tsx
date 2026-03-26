// MinigameScreen.tsx — Hauptscreen für das Idle-Tycoon Minigame

import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  GameState, GameAction, ItemType, PolarBear, DroppedItem,
  BackpackItem, FloatingText, Position,
} from './types';
import {
  GAME_TICK_MS, PLAYER_START_X, PLAYER_START_Y, PLAYER_SPEED,
  MAX_BACKPACK_CAPACITY, WORLD_WIDTH, WORLD_HEIGHT,
  BEAR_PEN, PICKUP_RADIUS,
  UI_BG_PRIMARY, UI_BORDER, UI_TEXT, RAW_MEAT_COLOR,
} from './constants';
import GameWorld from './components/GameWorld';
import VirtualJoystick from './components/VirtualJoystick';
import HUD from './components/HUD';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _nextId = 0;
function uid(): string { return `id_${++_nextId}_${Date.now().toString(36)}`; }

function dist(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function isInsideBearPen(pos: Position): boolean {
  return pos.x >= BEAR_PEN.x && pos.x <= BEAR_PEN.x + BEAR_PEN.width &&
         pos.y >= BEAR_PEN.y && pos.y <= BEAR_PEN.y + BEAR_PEN.height + 30; // +30 for gate area
}

function clampToPen(pos: Position): Position {
  const margin = 15;
  return {
    x: Math.max(BEAR_PEN.x + margin, Math.min(BEAR_PEN.x + BEAR_PEN.width - margin, pos.x)),
    y: Math.max(BEAR_PEN.y + margin, Math.min(BEAR_PEN.y + BEAR_PEN.height - margin, pos.y)),
  };
}

function randomPenPosition(): Position {
  return {
    x: BEAR_PEN.x + 40 + Math.random() * (BEAR_PEN.width - 80),
    y: BEAR_PEN.y + 40 + Math.random() * (BEAR_PEN.height - 80),
  };
}

function normalizedRandom(): Position {
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

// ─── Initial Bears ───────────────────────────────────────────────────────────

function createBears(count: number): PolarBear[] {
  const bears: PolarBear[] = [];
  for (let i = 0; i < count; i++) {
    bears.push({
      id: uid(),
      position: randomPenPosition(),
      hp: 40,
      maxHp: 40,
      alive: true,
      respawnTimer: 0,
      walkDirection: normalizedRandom(),
      walkTimer: Math.floor(randomInRange(60, 120)),
      idlePauseTimer: 0,
      size: Math.floor(randomInRange(18, 22)),
    });
  }
  return bears;
}

// ─── Initial State ───────────────────────────────────────────────────────────

function createInitialState(): GameState {
  return {
    playerPosition: { x: PLAYER_START_X, y: PLAYER_START_Y },
    playerSpeed: PLAYER_SPEED,
    playerDamage: 10,
    backpack: [],
    backpackCapacity: MAX_BACKPACK_CAPACITY,
    currentItemType: null,
    isMoving: false,

    bears: createBears(6),
    droppedItems: [],

    conveyorItems: [],
    shredderProcessing: [],
    steakOutputPile: 0,
    grillItems: [],
    grillOutputPile: 0,
    counterSteaks: 0,
    moneyPileAmount: 0,

    customers: [],
    customerBuyTimer: 0,

    totalMoney: 0,
    upgrades: [],

    attackCooldown: 0,
    isAttacking: false,
    attackTarget: null,

    floatingTexts: [],
    tutorialStep: 0,

    gameActive: true,
    tickCount: 0,
    lastFullWarningTick: -100,
  };
}

// ─── Game Tick Reducer ───────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK': {
      const { joystickDx, joystickDy } = action;
      const moving = Math.abs(joystickDx) > 0.05 || Math.abs(joystickDy) > 0.05;

      // ── Player movement ──
      let newX = state.playerPosition.x + joystickDx * state.playerSpeed;
      let newY = state.playerPosition.y + joystickDy * state.playerSpeed;
      const margin = 20;
      newX = Math.max(margin, Math.min(WORLD_WIDTH - margin, newX));
      newY = Math.max(margin, Math.min(WORLD_HEIGHT - margin, newY));
      const playerPos: Position = { x: newX, y: newY };

      // ── Bear AI ──
      const newBears = state.bears.map(bear => {
        if (!bear.alive) {
          // Respawn countdown
          const timer = bear.respawnTimer - 1;
          if (timer <= 0) {
            return {
              ...bear,
              alive: true,
              hp: bear.maxHp,
              position: randomPenPosition(),
              respawnTimer: 0,
              walkDirection: normalizedRandom(),
              walkTimer: Math.floor(randomInRange(60, 120)),
              idlePauseTimer: 0,
            };
          }
          return { ...bear, respawnTimer: timer };
        }

        // Living bear AI
        let { walkTimer, idlePauseTimer, walkDirection, position } = bear;

        if (idlePauseTimer > 0) {
          idlePauseTimer--;
          return { ...bear, idlePauseTimer };
        }

        walkTimer--;
        if (walkTimer <= 0) {
          // Decide: idle or new direction
          if (Math.random() < 0.3) {
            return {
              ...bear,
              idlePauseTimer: Math.floor(randomInRange(40, 80)),
              walkTimer: 0,
            };
          }
          return {
            ...bear,
            walkDirection: normalizedRandom(),
            walkTimer: Math.floor(randomInRange(60, 120)),
          };
        }

        // Move
        let nx = position.x + walkDirection.x * 0.4;
        let ny = position.y + walkDirection.y * 0.4;

        // Clamp to pen
        const clamped = clampToPen({ x: nx, y: ny });
        const hitBorder = clamped.x !== nx || clamped.y !== ny;
        if (hitBorder) {
          // Reverse direction
          return {
            ...bear,
            position: clamped,
            walkDirection: { x: -walkDirection.x, y: -walkDirection.y },
            walkTimer: Math.floor(randomInRange(30, 60)),
          };
        }

        return { ...bear, position: { x: nx, y: ny }, walkTimer };
      });

      // ── Combat ──
      let { attackCooldown, isAttacking, attackTarget } = state;
      const newFloats: FloatingText[] = [];
      const newDrops: DroppedItem[] = [];

      attackCooldown = Math.max(0, attackCooldown - 1);

      const playerInPen = isInsideBearPen(playerPos);
      if (playerInPen && attackCooldown === 0) {
        // Find nearest alive bear within range
        let nearestBear: PolarBear | null = null;
        let nearestDist = 40;
        for (const b of newBears) {
          if (!b.alive) continue;
          const d = dist(playerPos, b.position);
          if (d < nearestDist) {
            nearestDist = d;
            nearestBear = b;
          }
        }
        if (nearestBear) {
          isAttacking = true;
          attackTarget = nearestBear.id;
          attackCooldown = 10; // 0.5s

          // Apply damage
          const bearIdx = newBears.findIndex(b => b.id === nearestBear!.id);
          if (bearIdx >= 0) {
            const b = newBears[bearIdx];
            const newHp = b.hp - state.playerDamage;

            // Floating damage text
            newFloats.push({
              id: uid(),
              text: `-${state.playerDamage}`,
              position: { x: b.position.x, y: b.position.y },
              color: '#ffffff',
              opacity: 1,
              offsetY: -15,
              fontSize: 12,
            });

            if (newHp <= 0) {
              // Bear dies
              newBears[bearIdx] = {
                ...b,
                hp: 0,
                alive: false,
                respawnTimer: 160, // 8s
              };
              // "BONK!" text
              newFloats.push({
                id: uid(),
                text: 'BONK!',
                position: { x: b.position.x, y: b.position.y },
                color: '#ffffff',
                opacity: 1,
                offsetY: -30,
                fontSize: 16,
              });
              // Drop raw meat (2-4 items)
              const dropCount = 2 + Math.floor(Math.random() * 3);
              for (let d = 0; d < dropCount; d++) {
                newDrops.push({
                  id: uid(),
                  type: ItemType.RAW_MEAT,
                  position: {
                    x: b.position.x + randomInRange(-20, 20),
                    y: b.position.y + randomInRange(-15, 15),
                  },
                  collected: false,
                });
              }
            } else {
              newBears[bearIdx] = { ...b, hp: newHp };
            }
          }
        } else {
          isAttacking = false;
          attackTarget = null;
        }
      } else if (!playerInPen) {
        isAttacking = false;
        attackTarget = null;
      }

      // ── Item Pickup ──
      let backpack = [...state.backpack];
      let currentItemType = state.currentItemType;
      const allDrops = [...state.droppedItems, ...newDrops];
      let lastFullWarningTick = state.lastFullWarningTick;

      for (let i = 0; i < allDrops.length; i++) {
        const item = allDrops[i];
        if (item.collected) continue;
        if (dist(playerPos, item.position) >= PICKUP_RADIUS) continue;

        // Check capacity
        if (backpack.length >= state.backpackCapacity) {
          if (state.tickCount - lastFullWarningTick > 30) {
            newFloats.push({
              id: uid(),
              text: 'VOLL!',
              position: { x: playerPos.x, y: playerPos.y },
              color: '#e53935',
              opacity: 1,
              offsetY: -30,
              fontSize: 13,
            });
            lastFullWarningTick = state.tickCount;
          }
          break;
        }

        // Check item type compatibility
        if (currentItemType !== null && currentItemType !== item.type) {
          if (state.tickCount - lastFullWarningTick > 30) {
            newFloats.push({
              id: uid(),
              text: 'Erst ablegen!',
              position: { x: playerPos.x, y: playerPos.y },
              color: '#ffc107',
              opacity: 1,
              offsetY: -30,
              fontSize: 11,
            });
            lastFullWarningTick = state.tickCount;
          }
          continue;
        }

        // Pick up
        allDrops[i] = { ...item, collected: true };
        backpack.push({ id: uid(), type: item.type });
        currentItemType = item.type;
        newFloats.push({
          id: uid(),
          text: '+1',
          position: { x: playerPos.x, y: playerPos.y },
          color: '#ffffff',
          opacity: 1,
          offsetY: -20,
          fontSize: 11,
        });
      }

      // Filter out collected items
      const remainingDrops = allDrops.filter(d => !d.collected);

      // ── Floating texts decay ──
      const updatedFloats = [...state.floatingTexts, ...newFloats]
        .map(ft => ({
          ...ft,
          opacity: ft.opacity - 0.025,
          offsetY: ft.offsetY - 1.5,
        }))
        .filter(ft => ft.opacity > 0);

      return {
        ...state,
        playerPosition: playerPos,
        isMoving: moving,
        bears: newBears,
        droppedItems: remainingDrops,
        backpack,
        currentItemType: backpack.length === 0 ? null : currentItemType,
        attackCooldown,
        isAttacking,
        attackTarget,
        floatingTexts: updatedFloats,
        tickCount: state.tickCount + 1,
        lastFullWarningTick,
      };
    }

    case 'SET_PLAYER_POSITION':
      return { ...state, playerPosition: action.position };

    case 'RESET_GAME':
      return createInitialState();

    default:
      return state;
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

interface Props {
  navigation?: { goBack: () => void };
}

export default function MinigameScreen({ navigation }: Props) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const joystickRef = useRef({ dx: 0, dy: 0 });

  const handleJoystickMove = useCallback((dx: number, dy: number) => {
    joystickRef.current = { dx, dy };
  }, []);

  // Game loop
  useEffect(() => {
    if (!state.gameActive) return;
    const interval = setInterval(() => {
      dispatch({
        type: 'TICK',
        joystickDx: joystickRef.current.dx,
        joystickDy: joystickRef.current.dy,
      });
    }, GAME_TICK_MS);
    return () => clearInterval(interval);
  }, [state.gameActive]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={22} color={UI_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eisbären-Fabrik</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Game area */}
        <View style={styles.gameContainer}>
          <GameWorld state={state} />
          <HUD
            totalMoney={state.totalMoney}
            backpackCount={state.backpack.length}
            backpackCapacity={state.backpackCapacity}
            currentItemType={state.currentItemType}
          />
          <VirtualJoystick onJoystickMove={handleJoystickMove} />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: UI_BG_PRIMARY },
  container: { flex: 1, backgroundColor: UI_BG_PRIMARY },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: UI_BORDER,
    backgroundColor: UI_BG_PRIMARY,
  },
  backButton: { padding: 6 },
  headerTitle: { flex: 1, textAlign: 'center', color: UI_TEXT, fontSize: 16, fontWeight: 'bold' },
  headerSpacer: { width: 34 },
  gameContainer: { flex: 1, position: 'relative' },
});
