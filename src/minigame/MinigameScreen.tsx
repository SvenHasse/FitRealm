// MinigameScreen.tsx — Hauptscreen für das Idle-Tycoon Minigame

import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { GameState, GameAction, ItemType } from './types';
import {
  GAME_TICK_MS, PLAYER_START_X, PLAYER_START_Y, PLAYER_SPEED,
  MAX_BACKPACK_CAPACITY, WORLD_WIDTH, WORLD_HEIGHT,
  UI_BG_PRIMARY, UI_BORDER, UI_TEXT,
} from './constants';
import GameWorld from './components/GameWorld';
import VirtualJoystick from './components/VirtualJoystick';
import HUD from './components/HUD';

// ─── Initial State ───────────────────────────────────────────────────────────

function createInitialState(): GameState {
  return {
    playerPosition: { x: PLAYER_START_X, y: PLAYER_START_Y },
    playerSpeed: PLAYER_SPEED,
    playerDamage: 10,
    backpack: [],
    backpackCapacity: MAX_BACKPACK_CAPACITY,
    currentItemType: null,

    bears: [],
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
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK': {
      const { joystickDx, joystickDy } = action;

      // --- Player movement ---
      let newX = state.playerPosition.x + joystickDx * state.playerSpeed;
      let newY = state.playerPosition.y + joystickDy * state.playerSpeed;

      // Clamp to world bounds (with margin)
      const margin = 20;
      newX = Math.max(margin, Math.min(WORLD_WIDTH - margin, newX));
      newY = Math.max(margin, Math.min(WORLD_HEIGHT - margin, newY));

      // --- Floating texts decay ---
      const updatedFloats = state.floatingTexts
        .map(ft => ({
          ...ft,
          opacity: ft.opacity - 0.02,
          offsetY: ft.offsetY - 0.5,
        }))
        .filter(ft => ft.opacity > 0);

      return {
        ...state,
        playerPosition: { x: newX, y: newY },
        floatingTexts: updatedFloats,
        tickCount: state.tickCount + 1,
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

  // Joystick ref (shared between gesture thread and JS tick)
  const joystickRef = useRef({ dx: 0, dy: 0 });
  const isMovingRef = useRef(false);

  const handleJoystickMove = useCallback((dx: number, dy: number) => {
    joystickRef.current = { dx, dy };
    isMovingRef.current = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={UI_TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eisbären-Fabrik</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Game area */}
        <View style={styles.gameContainer}>
          <GameWorld state={{ ...state, isAttacking: state.isAttacking }} />

          {/* HUD overlay */}
          <HUD
            totalMoney={state.totalMoney}
            backpackCount={state.backpack.length}
            backpackCapacity={state.backpackCapacity}
            currentItemType={state.currentItemType}
          />

          {/* Joystick overlay */}
          <VirtualJoystick onJoystickMove={handleJoystickMove} />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI_BG_PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: UI_BG_PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: UI_BORDER,
    backgroundColor: UI_BG_PRIMARY,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: UI_TEXT,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 34,
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
  },
});
