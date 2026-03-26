// MinigameScreen.tsx — Hauptscreen für das Idle-Tycoon Minigame

import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  GameState, GameAction, ItemType, PolarBear, DroppedItem,
  BackpackItem, FloatingText, Position,
} from './types';
import {
  GAME_TICK_MS, PLAYER_START_X, PLAYER_START_Y, PLAYER_SPEED,
  MAX_BACKPACK_CAPACITY, WORLD_WIDTH, WORLD_HEIGHT,
  BEAR_PEN, PICKUP_RADIUS, STATION_INTERACT_RADIUS, UPGRADE_INTERACT_RADIUS,
  CONVEYOR_TABLE, STEAK_OUTPUT, SHREDDER,
  GRILL, GRILL_OUTPUT, SALES_COUNTER, MONEY_PILE,
  UI_BG_PRIMARY, UI_BORDER, UI_TEXT, UI_TEAL, UI_TEXT_DIM, RAW_MEAT_COLOR,
  UPGRADE_DEFINITIONS,
} from './constants';
import GameWorld from './components/GameWorld';
import VirtualJoystick from './components/VirtualJoystick';
import HUD from './components/HUD';
import DirectionArrow from './components/DirectionArrow';
import TutorialOverlay from './components/TutorialOverlay';

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
      walkTimer: Math.floor(randomInRange(90, 180)),
      idlePauseTimer: 0,
      size: Math.floor(randomInRange(18, 22)),
    });
  }
  return bears;
}

// ─── Initial Customers ───────────────────────────────────────────────────────

const CUSTOMER_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f9a825', '#6a1b9a', '#e65100'];

function createCustomers(count: number): import('./types').Customer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid(),
    color: CUSTOMER_COLORS[i % CUSTOMER_COLORS.length],
    hasSteakInHand: false,
    happyTimer: 0,
  }));
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

    bears: createBears(10),
    droppedItems: [],

    conveyorItems: [],
    shredderProcessing: [],
    steakOutputPile: 0,
    grillItems: [],
    grillOutputPile: 0,
    counterSteaks: 0,
    moneyPileAmount: 0,

    customers: createCustomers(6),
    customerBuyTimer: 60,

    totalMoney: 0,
    upgrades: UPGRADE_DEFINITIONS.map(u => ({ ...u })),

    attackCooldown: 0,
    isAttacking: false,
    attackTarget: null,

    floatingTexts: [],
    tutorialStep: 0,
    tutorialCompleteAt: 0,

    lastStationInteractTick: -100,
    gameActive: true,
    tickCount: 0,
    lastFullWarningTick: -100,
  };
}

// ─── Tutorial target positions (world coords) ──────────────────────────────

function getTutorialTarget(step: number): Position | null {
  switch (step) {
    case 1: return { x: BEAR_PEN.x + BEAR_PEN.width / 2, y: BEAR_PEN.y + BEAR_PEN.height / 2 };
    case 2: return { x: BEAR_PEN.x + BEAR_PEN.width / 2, y: BEAR_PEN.y + BEAR_PEN.height / 2 };
    case 3: return { x: BEAR_PEN.x + BEAR_PEN.width / 2, y: BEAR_PEN.y + BEAR_PEN.height / 2 };
    case 4: return { x: CONVEYOR_TABLE.x, y: CONVEYOR_TABLE.y };
    case 5: return { x: SHREDDER.x + SHREDDER.width / 2, y: SHREDDER.y + SHREDDER.height / 2 };
    case 6: return { x: STEAK_OUTPUT.x, y: STEAK_OUTPUT.y };
    case 7: return { x: GRILL.x + GRILL.width / 2, y: GRILL.y + GRILL.height / 2 };
    case 8: return { x: GRILL_OUTPUT.x, y: GRILL_OUTPUT.y };
    case 9: return { x: SALES_COUNTER.x + SALES_COUNTER.width / 2, y: SALES_COUNTER.y };
    case 10: return { x: MONEY_PILE.x, y: MONEY_PILE.y };
    case 11: return { x: 500, y: 620 }; // Approximate upgrade area
    default: return null;
  }
}

// ─── Game Tick Reducer ───────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK': {
      try {
      const { joystickDx, joystickDy } = action;
      const moving = Math.abs(joystickDx) > 0.05 || Math.abs(joystickDy) > 0.05;

      // ── Pre-compute Upgrade Effects (from current state) ──
      const _axeUpg = state.upgrades.find(u => u.id === 'stronger_axe');
      const preEffDamage = 10 + ((_axeUpg?.currentLevel ?? 0) * 10);
      const _bpUpg = state.upgrades.find(u => u.id === 'bigger_backpack');
      const preEffCapacity = 15 + ((_bpUpg?.currentLevel ?? 0) * 5);
      const _shoeUpg = state.upgrades.find(u => u.id === 'faster_shoes');
      const preEffSpeed = 5.5 + ((_shoeUpg?.currentLevel ?? 0) * 0.8);
      const _convUpg = state.upgrades.find(u => u.id === 'better_conveyor');
      const preConvLevel = _convUpg?.currentLevel ?? 0;
      const _grillUpg = state.upgrades.find(u => u.id === 'better_grill');
      const preGrillLevel = _grillUpg?.currentLevel ?? 0;
      const preEffGrillCap = 3 + preGrillLevel * 2;
      const _custUpg = state.upgrades.find(u => u.id === 'more_customers');
      const preCustLevel = _custUpg?.currentLevel ?? 0;

      // ── Player movement ──
      let newX = state.playerPosition.x + joystickDx * preEffSpeed;
      let newY = state.playerPosition.y + joystickDy * preEffSpeed;
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
              walkTimer: Math.floor(randomInRange(90, 180)),
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
              idlePauseTimer: Math.floor(randomInRange(60, 120)),
              walkTimer: 0,
            };
          }
          return {
            ...bear,
            walkDirection: normalizedRandom(),
            walkTimer: Math.floor(randomInRange(90, 180)),
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
          attackCooldown = 15; // 0.5s at 30/s

          // Apply damage
          const bearIdx = newBears.findIndex(b => b.id === nearestBear!.id);
          if (bearIdx >= 0) {
            const b = newBears[bearIdx];
            const newHp = b.hp - preEffDamage;

            // Floating damage text
            newFloats.push({
              id: uid(),
              text: `-${preEffDamage}`,
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
                respawnTimer: 150, // 5s at 30/s
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
        if (backpack.length >= preEffCapacity) {
          if (state.tickCount - lastFullWarningTick > 45) {
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
          if (state.tickCount - lastFullWarningTick > 45) {
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
        backpack = [...backpack, { id: uid(), type: item.type }];
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

      // ── Station Interactions ──
      let conveyorItems = [...state.conveyorItems];
      let shredderProcessing = [...state.shredderProcessing];
      let steakOutputPile = state.steakOutputPile;
      let lastStationInteractTick = state.lastStationInteractTick;
      const stationCooldown = 9; // ticks between drops/pickups (0.3s at 30/s)

      // CONVEYOR_TABLE: Drop raw meat from backpack onto conveyor
      const tablePos: Position = { x: CONVEYOR_TABLE.x, y: CONVEYOR_TABLE.y };
      if (dist(playerPos, tablePos) < STATION_INTERACT_RADIUS &&
          currentItemType !== null && currentItemType === ItemType.RAW_MEAT &&
          backpack.length > 0 &&
          state.tickCount - lastStationInteractTick >= stationCooldown) {
        // Remove one item from backpack
        backpack = backpack.slice(0, -1);
        if (backpack.length === 0) currentItemType = null;
        // Add to conveyor
        conveyorItems = [...conveyorItems, { id: uid(), progress: 0 }];
        lastStationInteractTick = state.tickCount;
        newFloats.push({
          id: uid(), text: '-1', position: { x: playerPos.x, y: playerPos.y },
          color: '#e53935', opacity: 1, offsetY: -20, fontSize: 11,
        });
      }

      // STEAK_OUTPUT: Pick up steaks
      const steakOutPos: Position = { x: STEAK_OUTPUT.x, y: STEAK_OUTPUT.y };
      if (dist(playerPos, steakOutPos) < STATION_INTERACT_RADIUS &&
          steakOutputPile > 0 &&
          (currentItemType === null || currentItemType === ItemType.STEAK) &&
          backpack.length < preEffCapacity &&
          state.tickCount - lastStationInteractTick >= stationCooldown) {
        steakOutputPile = Math.max(0, steakOutputPile - 1);
        backpack = [...backpack, { id: uid(), type: ItemType.STEAK }];
        currentItemType = ItemType.STEAK;
        lastStationInteractTick = state.tickCount;
        newFloats.push({
          id: uid(), text: '+1', position: { x: playerPos.x, y: playerPos.y },
          color: '#8d6e63', opacity: 1, offsetY: -20, fontSize: 11,
        });
      }

      // ── Conveyor Belt Movement ──
      conveyorItems = conveyorItems.map(ci => ({ ...ci, progress: ci.progress + 0.005 * Math.pow(1.5, preConvLevel) }));

      // Items reaching end of belt -> into shredder
      const arrivedItems = conveyorItems.filter(ci => ci.progress >= 1.0);
      conveyorItems = conveyorItems.filter(ci => ci.progress < 1.0);
      for (const _item of arrivedItems) {
        shredderProcessing = [...shredderProcessing, { id: uid(), progress: 0 }];
      }

      // ── Shredder Processing ──
      shredderProcessing = shredderProcessing.map(sp => ({ ...sp, progress: sp.progress + 0.017 * Math.pow(1.5, preConvLevel) }));
      const finishedSteaks = shredderProcessing.filter(sp => sp.progress >= 1.0);
      shredderProcessing = shredderProcessing.filter(sp => sp.progress < 1.0);
      if (finishedSteaks.length > 0) {
        steakOutputPile += finishedSteaks.length;
        for (const _s of finishedSteaks) {
          newFloats.push({
            id: uid(), text: '+1 Steak',
            position: { x: SHREDDER.x + SHREDDER.width / 2, y: SHREDDER.y },
            color: '#8d6e63', opacity: 1, offsetY: -10, fontSize: 10,
          });
        }
      }

      // ── Grill Interactions ──
      let grillItems = [...state.grillItems];
      let grillOutputPile = state.grillOutputPile;

      // GRILL: Drop steaks from backpack
      const grillPos: Position = { x: GRILL.x + GRILL.width / 2, y: GRILL.y + GRILL.height / 2 };
      if (dist(playerPos, grillPos) < STATION_INTERACT_RADIUS &&
          currentItemType !== null && currentItemType === ItemType.STEAK &&
          backpack.length > 0 &&
          grillItems.length < preEffGrillCap &&
          state.tickCount - lastStationInteractTick >= stationCooldown) {
        backpack = backpack.slice(0, -1);
        if (backpack.length === 0) currentItemType = null;
        grillItems = [...grillItems, { id: uid(), progress: 0 }];
        lastStationInteractTick = state.tickCount;
        newFloats.push({
          id: uid(), text: '-1', position: { x: playerPos.x, y: playerPos.y },
          color: '#8d6e63', opacity: 1, offsetY: -20, fontSize: 11,
        });
      }

      // GRILL_OUTPUT: Pick up grilled steaks
      const grillOutPos: Position = { x: GRILL_OUTPUT.x, y: GRILL_OUTPUT.y };
      if (dist(playerPos, grillOutPos) < STATION_INTERACT_RADIUS &&
          grillOutputPile > 0 &&
          (currentItemType === null || currentItemType === ItemType.GRILLED_STEAK) &&
          backpack.length < preEffCapacity &&
          state.tickCount - lastStationInteractTick >= stationCooldown) {
        grillOutputPile = Math.max(0, grillOutputPile - 1);
        backpack = [...backpack, { id: uid(), type: ItemType.GRILLED_STEAK }];
        currentItemType = ItemType.GRILLED_STEAK;
        lastStationInteractTick = state.tickCount;
        newFloats.push({
          id: uid(), text: '+1', position: { x: playerPos.x, y: playerPos.y },
          color: '#5d4037', opacity: 1, offsetY: -20, fontSize: 11,
        });
      }

      // Grill processing
      grillItems = grillItems.map(gi => ({ ...gi, progress: gi.progress + 0.011 * Math.pow(1.4, preGrillLevel) }));
      const finishedGrilled = grillItems.filter(gi => gi.progress >= 1.0);
      grillItems = grillItems.filter(gi => gi.progress < 1.0);
      if (finishedGrilled.length > 0) {
        grillOutputPile += finishedGrilled.length;
        for (const _g of finishedGrilled) {
          newFloats.push({
            id: uid(), text: '+1 Grill-Steak',
            position: { x: GRILL.x + GRILL.width / 2, y: GRILL.y },
            color: '#5d4037', opacity: 1, offsetY: -10, fontSize: 10,
          });
        }
      }

      // ── Sales Counter ──
      let counterSteaks = state.counterSteaks;
      let moneyPileAmount = state.moneyPileAmount || 0;
      let totalMoney = state.totalMoney;

      // Drop grilled steaks at counter (max 20 on counter)
      const counterPos: Position = { x: SALES_COUNTER.x + SALES_COUNTER.width / 2, y: SALES_COUNTER.y };
      if (dist(playerPos, counterPos) < STATION_INTERACT_RADIUS + 20 &&
          currentItemType !== null && currentItemType === ItemType.GRILLED_STEAK &&
          backpack.length > 0 &&
          counterSteaks < 20 &&
          state.tickCount - lastStationInteractTick >= stationCooldown) {
        backpack = backpack.slice(0, -1);
        if (backpack.length === 0) currentItemType = null;
        counterSteaks += 1;
        lastStationInteractTick = state.tickCount;
        newFloats.push({
          id: uid(), text: '-1', position: { x: playerPos.x, y: playerPos.y },
          color: '#5d4037', opacity: 1, offsetY: -20, fontSize: 11,
        });
      }

      // ── Customer Buy Logic ──
      let customerBuyTimer = state.customerBuyTimer - 1;
      let newCustomers = state.customers.map(c => ({
        ...c,
        happyTimer: Math.max(0, c.happyTimer - 1),
      }));

      if (customerBuyTimer <= 0 && counterSteaks > 0) {
        counterSteaks = Math.max(0, counterSteaks - 1);
        moneyPileAmount = (moneyPileAmount || 0) + 10;
        customerBuyTimer = [60, 45, 33][preCustLevel] ?? 33;
        newFloats.push({
          id: uid(), text: '+$10',
          position: { x: SALES_COUNTER.x + SALES_COUNTER.width / 2, y: SALES_COUNTER.y - 10 },
          color: '#ffd700', opacity: 1, offsetY: -10, fontSize: 12,
        });
        // Make a random customer happy
        const unhappy = newCustomers.filter(c => c.happyTimer === 0);
        if (unhappy.length > 0) {
          const lucky = unhappy[Math.floor(Math.random() * unhappy.length)];
          newCustomers = newCustomers.map(c =>
            c.id === lucky.id ? { ...c, happyTimer: 30, hasSteakInHand: true } : c
          );
        }
      }

      // ── Money Pile Pickup ──
      const moneyPos: Position = { x: MONEY_PILE.x, y: MONEY_PILE.y };
      const moneyPickupCooldown = 5; // at 30/s
      if (dist(playerPos, moneyPos) < PICKUP_RADIUS + 5 &&
          (moneyPileAmount || 0) >= 10 &&
          (currentItemType === null || currentItemType === ItemType.MONEY) &&
          backpack.length < preEffCapacity &&
          state.tickCount - lastStationInteractTick >= moneyPickupCooldown) {
        moneyPileAmount = Math.max(0, (moneyPileAmount || 0) - 10);
        backpack = [...backpack, { id: uid(), type: ItemType.MONEY }];
        currentItemType = ItemType.MONEY;
        lastStationInteractTick = state.tickCount;
        // "CHA-CHING!" only on first pickup in sequence
        if (state.currentItemType !== ItemType.MONEY) {
          newFloats.push({
            id: uid(), text: 'CHA-CHING!',
            position: { x: playerPos.x, y: playerPos.y },
            color: '#ffd700', opacity: 1, offsetY: -35, fontSize: 13,
          });
        }
      }

      // ── Upgrade Payment ──
      let upgrades = state.upgrades.map(u => ({ ...u }));
      const upgradePayCooldown = 3; // at 30/s

      if (state.tickCount % 2 === 0) {
        for (let ui = 0; ui < upgrades.length; ui++) {
          const upg = upgrades[ui];
          if (upg.currentLevel >= upg.maxLevel) continue;
          if (dist(playerPos, upg.position) >= UPGRADE_INTERACT_RADIUS) continue;
          if (currentItemType !== ItemType.MONEY || backpack.length === 0) continue;
          if (state.tickCount - lastStationInteractTick < upgradePayCooldown) continue;

          // Pay $10
          backpack = backpack.slice(0, -1);
          if (backpack.length === 0) currentItemType = null;
          upg.paidAmount += 10;
          lastStationInteractTick = state.tickCount;

          // Check if upgrade complete
          const cost = upg.costs[upg.currentLevel];
          if (upg.paidAmount >= cost) {
            upg.currentLevel += 1;
            upg.paidAmount = 0;
            newFloats.push({
              id: uid(), text: 'UPGRADE!',
              position: { x: upg.position.x, y: upg.position.y },
              color: '#4caf50', opacity: 1, offsetY: -20, fontSize: 18,
            });
          }
          break; // Only pay one upgrade per tick
        }
      }

      // ── Compute Upgrade Effects ──
      const axeUpg = upgrades.find(u => u.id === 'stronger_axe');
      const effectiveDamage = 10 + ((axeUpg?.currentLevel ?? 0) * 10);

      const bpUpg = upgrades.find(u => u.id === 'bigger_backpack');
      const effectiveCapacity = 15 + ((bpUpg?.currentLevel ?? 0) * 5);

      const shoeUpg = upgrades.find(u => u.id === 'faster_shoes');
      const effectiveSpeed = 5.5 + ((shoeUpg?.currentLevel ?? 0) * 0.8);

      const convUpg = upgrades.find(u => u.id === 'better_conveyor');
      const _convLevel = convUpg?.currentLevel ?? 0;

      const grillUpg = upgrades.find(u => u.id === 'better_grill');
      const grillLevel = grillUpg?.currentLevel ?? 0;
      const effectiveGrillCap = 3 + grillLevel * 2;

      const custUpg = upgrades.find(u => u.id === 'more_customers');
      const custLevel = custUpg?.currentLevel ?? 0;

      const autoConvUpg = upgrades.find(u => u.id === 'auto_conveyor');
      const hasAutoConveyor = (autoConvUpg?.currentLevel ?? 0) >= 1;

      // ── Auto-Conveyor: steakOutputPile -> grill ──
      if (hasAutoConveyor && steakOutputPile > 0 && grillItems.length < effectiveGrillCap && state.tickCount % 15 === 0) {
        steakOutputPile = Math.max(0, steakOutputPile - 1);
        grillItems = [...grillItems, { id: uid(), progress: 0 }];
      }

      // ── Add customers if needed ──
      const targetCustomerCount = 6 + custLevel * 3;
      if (newCustomers.length < targetCustomerCount) {
        const toAdd: typeof newCustomers = [];
        while (newCustomers.length + toAdd.length < targetCustomerCount) {
          toAdd.push({
            id: uid(),
            color: CUSTOMER_COLORS[(newCustomers.length + toAdd.length) % CUSTOMER_COLORS.length],
            hasSteakInHand: false,
            happyTimer: 0,
          });
        }
        newCustomers = [...newCustomers, ...toAdd];
      }

      // ── Floating texts decay + cap at 15 ──
      const updatedFloats = [...state.floatingTexts, ...newFloats]
        .map(ft => ({
          ...ft,
          opacity: ft.opacity - 0.017,
          offsetY: ft.offsetY - 1.0,
        }))
        .filter(ft => ft.opacity > 0)
        .slice(-15);

      // ── Tutorial Step Transitions ──
      let tutorialStep = state.tutorialStep;
      let tutorialCompleteAt = state.tutorialCompleteAt;
      const finalCurrentItemType = backpack.length === 0 ? null : currentItemType;

      if (tutorialStep > 0) {
        switch (tutorialStep) {
          case 1:
            if (isInsideBearPen(playerPos)) tutorialStep = 2;
            break;
          case 2:
            if (newBears.some(b => !b.alive)) tutorialStep = 3;
            break;
          case 3:
            if (backpack.length > 0 && finalCurrentItemType === ItemType.RAW_MEAT) tutorialStep = 4;
            break;
          case 4:
            if (conveyorItems.length > 0 && backpack.length === 0) tutorialStep = 5;
            break;
          case 5:
            if (steakOutputPile > 0) tutorialStep = 6;
            break;
          case 6:
            if (backpack.length > 0 && finalCurrentItemType === ItemType.STEAK) tutorialStep = 7;
            break;
          case 7:
            if (grillItems.length > 0 && backpack.length === 0) tutorialStep = 8;
            break;
          case 8:
            if (backpack.length > 0 && finalCurrentItemType === ItemType.GRILLED_STEAK) tutorialStep = 9;
            break;
          case 9:
            if (counterSteaks > 0 && backpack.length === 0) tutorialStep = 10;
            break;
          case 10:
            if ((moneyPileAmount || 0) > 0 && backpack.length > 0 && finalCurrentItemType === ItemType.MONEY) tutorialStep = 11;
            break;
          case 11:
            if (upgrades.some(u => u.currentLevel > 0)) tutorialStep = 12;
            break;
          case 12:
            if (tutorialCompleteAt === 0) {
              tutorialCompleteAt = state.tickCount;
            } else if (state.tickCount - tutorialCompleteAt > 90) {
              tutorialStep = 0;
              tutorialCompleteAt = 0;
            }
            break;
        }
      }

      return {
        ...state,
        playerPosition: playerPos,
        playerSpeed: effectiveSpeed,
        playerDamage: effectiveDamage,
        backpackCapacity: effectiveCapacity,
        isMoving: moving,
        bears: newBears,
        droppedItems: remainingDrops,
        backpack,
        currentItemType: finalCurrentItemType,
        attackCooldown,
        isAttacking,
        attackTarget,
        conveyorItems,
        shredderProcessing,
        steakOutputPile: Math.max(0, steakOutputPile),
        grillItems,
        grillOutputPile: Math.max(0, grillOutputPile),
        counterSteaks: Math.max(0, counterSteaks),
        moneyPileAmount: Math.max(0, moneyPileAmount || 0),
        totalMoney: Math.max(0, totalMoney),
        upgrades,
        customerBuyTimer,
        customers: newCustomers,
        lastStationInteractTick,
        floatingTexts: updatedFloats,
        tutorialStep,
        tutorialCompleteAt,
        tickCount: state.tickCount + 1,
        lastFullWarningTick,
      };
      } catch (error) {
        console.warn('GameTick error:', error);
        return { ...state, tickCount: state.tickCount + 1 };
      }
    }

    case 'SET_PLAYER_POSITION':
      return { ...state, playerPosition: action.position };

    case 'SET_TUTORIAL_STEP':
      return { ...state, tutorialStep: action.step };

    case 'RESET_GAME':
      return createInitialState();

    default:
      return state;
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

interface MinigameScreenProps {
  navigation?: { goBack: () => void };
  onExit?: () => void;
  onEarnReward?: (reward: { muskelmasse: number; protein: number; nahrung: number }) => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function MinigameScreen({ navigation, onExit, onEarnReward }: MinigameScreenProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const joystickRef = useRef({ dx: 0, dy: 0 });

  const handleJoystickMove = useCallback((dx: number, dy: number) => {
    joystickRef.current = { dx, dy };
  }, []);

  // Start screen fade-in
  const startFade = useSharedValue(0);
  useEffect(() => {
    startFade.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, []);

  const startFadeStyle = useAnimatedStyle(() => ({
    opacity: startFade.value,
  }));

  // Game loop - only run when not showing start screen
  useEffect(() => {
    if (!state.gameActive || showStartScreen) return;
    const interval = setInterval(() => {
      dispatch({
        type: 'TICK',
        joystickDx: joystickRef.current.dx,
        joystickDy: joystickRef.current.dy,
      });
    }, GAME_TICK_MS);
    return () => clearInterval(interval);
  }, [state.gameActive, showStartScreen]);

  // Claim reward handler
  const handleClaimReward = useCallback(() => {
    if (state.totalMoney <= 0 || !onEarnReward) return;
    const muskelmasse = Math.floor(state.totalMoney / 100);
    const protein = Math.floor(state.totalMoney / 100) * 2;
    const nahrung = Math.floor(state.totalMoney / 100) * 5;
    onEarnReward({ muskelmasse, protein, nahrung });
    // Reset money - we'll handle this via a dispatch
    // For now, call onEarnReward with calculated values
  }, [state.totalMoney, onEarnReward]);

  // Handle exit
  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
    } else if (navigation) {
      navigation.goBack();
    }
  }, [onExit, navigation]);

  // Tutorial target position (convert world coords to approximate screen coords)
  const tutorialTargetWorld = getTutorialTarget(state.tutorialStep);
  const tutorialTargetScreen = tutorialTargetWorld
    ? { screenX: SCREEN_W / 2 + (tutorialTargetWorld.x - state.playerPosition.x) * 0.5, screenY: SCREEN_H / 2 + (tutorialTargetWorld.y - state.playerPosition.y) * 0.5 }
    : null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleExit}>
            <Ionicons name="arrow-back" size={22} color={UI_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eisb{'\u00e4'}ren-Fabrik</Text>
          {state.totalMoney > 0 && onEarnReward ? (
            <TouchableOpacity style={styles.rewardBtn} onPress={handleClaimReward}>
              <Text style={styles.rewardBtnText}>Einl{'\u00f6'}sen</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Game area */}
        <View style={styles.gameContainer}>
          <View style={showStartScreen ? styles.gameWorldDimmed : styles.gameWorldFull}>
            <GameWorld state={state} />
          </View>

          {/* Start Screen Overlay */}
          {showStartScreen && (
            <Animated.View style={[styles.startOverlay, startFadeStyle]}>
              <Text style={styles.startTitle}>EISB{'\u00c4'}REN-FABRIK</Text>
              <Text style={styles.startSubtitle}>Jage {'\u00b7'} Verarbeite {'\u00b7'} Verkaufe</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => {
                  setShowStartScreen(false);
                  dispatch({ type: 'RESET_GAME' });
                  dispatch({ type: 'SET_TUTORIAL_STEP', step: 1 });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.playButtonText}>SPIELEN</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!showStartScreen && (
            <>
              <HUD
                totalMoney={state.totalMoney}
                backpackCount={state.backpack.length}
                backpackCapacity={state.backpackCapacity}
                currentItemType={state.currentItemType}
                onClaimReward={onEarnReward ? handleClaimReward : undefined}
              />
              {/* Direction Arrows */}
              {(() => {
                const it = state.currentItemType;
                let arrowTarget: Position | null = null;
                let arrowColor = '#ffffff';

                if (it === ItemType.RAW_MEAT) {
                  arrowTarget = { x: CONVEYOR_TABLE.x, y: CONVEYOR_TABLE.y };
                  arrowColor = RAW_MEAT_COLOR;
                } else if (it === ItemType.STEAK) {
                  arrowTarget = { x: GRILL.x + GRILL.width / 2, y: GRILL.y + GRILL.height / 2 };
                  arrowColor = '#8d6e63';
                } else if (it === ItemType.GRILLED_STEAK) {
                  arrowTarget = { x: SALES_COUNTER.x + SALES_COUNTER.width / 2, y: SALES_COUNTER.y };
                  arrowColor = '#5d4037';
                } else if (it === ItemType.MONEY) {
                  // Find nearest unpaid upgrade
                  let nearest: Position | null = null;
                  let nearestDist = Infinity;
                  for (const upg of state.upgrades) {
                    if (upg.currentLevel >= upg.maxLevel) continue;
                    const d = dist(state.playerPosition, upg.position);
                    if (d < nearestDist) {
                      nearestDist = d;
                      nearest = upg.position;
                    }
                  }
                  if (nearest) {
                    arrowTarget = nearest;
                    arrowColor = '#4caf50';
                  }
                }

                if (!arrowTarget) return null;
                return (
                  <DirectionArrow
                    targetX={arrowTarget.x}
                    targetY={arrowTarget.y}
                    playerX={state.playerPosition.x}
                    playerY={state.playerPosition.y}
                    color={arrowColor}
                    visible={true}
                    screenWidth={SCREEN_W}
                    screenHeight={SCREEN_H}
                    tick={state.tickCount}
                  />
                );
              })()}
              {/* Tutorial Overlay */}
              <TutorialOverlay
                step={state.tutorialStep}
                targetPosition={tutorialTargetScreen}
              />
              <VirtualJoystick onJoystickMove={handleJoystickMove} />
            </>
          )}
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
  rewardBtn: {
    backgroundColor: '#d4a06a',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  rewardBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameContainer: { flex: 1, position: 'relative' },
  gameWorldDimmed: { flex: 1, opacity: 0.3 },
  gameWorldFull: { flex: 1 },
  // Start screen overlay
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(14,16,22,0.6)',
  },
  startTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 8,
  },
  startSubtitle: {
    color: UI_TEXT_DIM,
    fontSize: 14,
    marginBottom: 30,
  },
  playButton: {
    backgroundColor: UI_TEAL,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
