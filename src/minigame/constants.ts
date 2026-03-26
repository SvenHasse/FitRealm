// constants.ts — Alle Spielkonstanten für das Idle-Tycoon Minigame

// ─── Spielwelt-Dimensionen ───────────────────────────────────────────────────
export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 1600;

// ─── Spieler ─────────────────────────────────────────────────────────────────
export const PLAYER_SPEED = 5.5;
export const PLAYER_RADIUS = 14;
export const PLAYER_START_X = 500;
export const PLAYER_START_Y = 700;

// ─── Joystick ────────────────────────────────────────────────────────────────
export const JOYSTICK_RADIUS = 60;
export const JOYSTICK_KNOB_RADIUS = 24;
export const JOYSTICK_DEAD_ZONE = 5;

// ─── Game Loop ───────────────────────────────────────────────────────────────
export const GAME_TICK_MS = 33; // ~30 ticks/s

// ─── UI-Farben (FitRealm Dark Theme) ────────────────────────────────────────
export const UI_BG_PRIMARY = '#0e1016';
export const UI_BG_SECONDARY = '#151820';
export const UI_BG_TERTIARY = '#1c2030';
export const UI_BORDER = '#2a2f40';
export const UI_TEXT = '#d0d4e0';
export const UI_TEXT_DIM = '#606880';
export const UI_GOLD = '#F5A623';
export const UI_TEAL = '#2E8B72';
export const UI_RED = '#E53935';

// ─── Spielwelt-Farben (hell, Cartoon) ────────────────────────────────────────
export const SNOW_COLOR_LIGHT = '#e8eef1';
export const SNOW_COLOR_DARK = '#c5d5dd';
export const SAND_COLOR = '#d4a574';
export const SAND_COLOR_DARK = '#c49a6c';
export const FENCE_WOOD = '#8d5524';
export const FENCE_TIP_RED = '#c62828';
export const GATE_WOOD_DARK = '#6d3a0a';
export const GATE_GOLD = '#ffd700';

// ─── Item-Farben ─────────────────────────────────────────────────────────────
export const RAW_MEAT_COLOR = '#e53935';
export const STEAK_COLOR = '#8d6e63';
export const GRILLED_STEAK_COLOR = '#5d4037';
export const GRILLED_STEAK_STRIPE = '#ff9800';
export const MONEY_COLOR = '#4caf50';
export const MONEY_GOLD = '#ffd700';

// ─── Spieler-Farben ──────────────────────────────────────────────────────────
export const PLAYER_JACKET = '#1565c0';
export const PLAYER_JACKET_LIGHT = '#1976d2';
export const PLAYER_SKIN = '#ffcc80';
export const PLAYER_HAT = '#2e7d32';
export const PLAYER_SELECTION_RING = '#4caf50';

// ─── Eisbär-Farben ───────────────────────────────────────────────────────────
export const BEAR_BODY = '#f5f5f0';
export const BEAR_SHADING = '#e8e8e0';
export const BEAR_INNER_EAR = '#dddddd';

// ─── Rucksack ────────────────────────────────────────────────────────────────
export const MAX_BACKPACK_CAPACITY = 15;
export const BACKPACK_ITEM_WIDTH = 12;
export const BACKPACK_ITEM_HEIGHT = 10;
export const BACKPACK_STACK_OFFSET_Y = -8;

// ─── Layout-Positionen (Welt-Koordinaten) ────────────────────────────────────
export const BEAR_PEN = { x: 150, y: 50, width: 700, height: 320 };
export const BEAR_PEN_GATE = { x: 425, y: 370, width: 150 };
export const CONVEYOR_TABLE = { x: 250, y: 530 };
export const CONVEYOR_BELT = { startX: 250, startY: 530, endX: 120, endY: 490, width: 30 };
export const SHREDDER = { x: 100, y: 470, width: 90, height: 75 };
export const STEAK_OUTPUT = { x: 100, y: 560 };
export const GRILL = { x: 750, y: 720, width: 75, height: 60 };
export const GRILL_OUTPUT = { x: 750, y: 800 };
export const SALES_COUNTER = { x: 350, y: 950, width: 400, height: 30 };
export const MONEY_PILE = { x: 500, y: 1010 };
export const CUSTOMER_ROW_Y = 1030;

// ─── Interaktions-Radien ─────────────────────────────────────────────────────
export const PICKUP_RADIUS = 25;
export const STATION_INTERACT_RADIUS = 35;
export const UPGRADE_INTERACT_RADIUS = 45;

// ─── Upgrade-Definitionen ────────────────────────────────────────────────────
import { UpgradeDefinition } from './types';

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'stronger_axe', name: 'Stärkere Axt', icon: 'axe',
    costs: [50, 120, 250], maxLevel: 3,
    position: { x: 550, y: 430 }, paidAmount: 0, currentLevel: 0,
    description: 'Mehr Schaden gegen Eisbären',
  },
  {
    id: 'bigger_backpack', name: 'Größerer Rucksack', icon: 'backpack',
    costs: [80, 180, 350], maxLevel: 3,
    position: { x: 500, y: 620 }, paidAmount: 0, currentLevel: 0,
    description: 'Mehr Tragekapazität',
  },
  {
    id: 'faster_shoes', name: 'Schnellere Schuhe', icon: 'shoe',
    costs: [60, 150], maxLevel: 2,
    position: { x: 350, y: 620 }, paidAmount: 0, currentLevel: 0,
    description: 'Schneller laufen',
  },
  {
    id: 'better_conveyor', name: 'Schnelleres Band', icon: 'gear',
    costs: [100, 220], maxLevel: 2,
    position: { x: 180, y: 570 }, paidAmount: 0, currentLevel: 0,
    description: 'Förderband + Schredder schneller',
  },
  {
    id: 'better_grill', name: 'Besserer Grill', icon: 'flame',
    costs: [120, 250], maxLevel: 2,
    position: { x: 800, y: 750 }, paidAmount: 0, currentLevel: 0,
    description: 'Schneller grillen, mehr Kapazität',
  },
  {
    id: 'more_customers', name: 'Mehr Kunden', icon: 'people',
    costs: [150, 300], maxLevel: 2,
    position: { x: 650, y: 960 }, paidAmount: 0, currentLevel: 0,
    description: 'Mehr und schnellere Kunden',
  },
  {
    id: 'auto_conveyor', name: 'Auto-Transport', icon: 'conveyor',
    costs: [500], maxLevel: 1,
    position: { x: 450, y: 680 }, paidAmount: 0, currentLevel: 0,
    description: 'Automatisches Band: Schredder → Grill',
  },
];
