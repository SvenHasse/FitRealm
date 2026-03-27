// constants.ts — Alle Spielkonstanten für das Idle-Tycoon Minigame

// ─── Spielwelt-Dimensionen ───────────────────────────────────────────────────
export const WORLD_WIDTH = 700;
export const WORLD_HEIGHT = 1000;

// ─── Spieler ─────────────────────────────────────────────────────────────────
export const PLAYER_SPEED = 7.0;
export const PLAYER_RADIUS = 14;
export const PLAYER_START_X = 350;
export const PLAYER_START_Y = 400;

// ─── Joystick ────────────────────────────────────────────────────────────────
export const JOYSTICK_RADIUS = 60;
export const JOYSTICK_KNOB_RADIUS = 24;
export const JOYSTICK_DEAD_ZONE = 5;

// ─── Game Loop ───────────────────────────────────────────────────────────────
export const GAME_TICK_MS = 50; // 20 ticks/s (rAF + accumulator)

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

// ─── Spielwelt-Farben (Herbst / Jagd-Thema) ────────────────────────────────
export const SNOW_COLOR_LIGHT = '#7a9a4e';
export const SNOW_COLOR_DARK = '#c4a265';
export const SAND_COLOR = '#b8956a';
export const SAND_COLOR_DARK = '#a07850';
export const FENCE_WOOD = '#4a3520';
export const FENCE_TIP_RED = '#4a3520';
export const GATE_WOOD_DARK = '#3a2510';
export const GATE_GOLD = '#6b7b8d';

// ─── Item-Farben ─────────────────────────────────────────────────────────────
export const RAW_MEAT_COLOR = '#e53935';
export const STEAK_COLOR = '#a0522d';
export const GRILLED_STEAK_COLOR = '#5d4037';
export const GRILLED_STEAK_STRIPE = '#ff9800';
export const MONEY_COLOR = '#F5A623';
export const MONEY_GOLD = '#F5A623';

// ─── Spieler-Farben ──────────────────────────────────────────────────────────
export const PLAYER_JACKET = '#6d4c41';
export const PLAYER_JACKET_LIGHT = '#7d5c51';
export const PLAYER_SKIN = '#ffcc80';
export const PLAYER_HAT = '#78909c';
export const PLAYER_SELECTION_RING = '#F5A623';

// ─── Wildschwein-Farben ─────────────────────────────────────────────────────
export const BEAR_BODY = '#8B6914';
export const BEAR_SHADING = '#7a5a10';
export const BEAR_INNER_EAR = '#6d4c11';

// ─── Rucksack ────────────────────────────────────────────────────────────────
export const MAX_BACKPACK_CAPACITY = 15;
export const BACKPACK_ITEM_WIDTH = 12;
export const BACKPACK_ITEM_HEIGHT = 10;
export const BACKPACK_STACK_OFFSET_Y = -8;

// ─── Layout-Positionen (Welt-Koordinaten) ────────────────────────────────────
export const BEAR_PEN = { x: 150, y: 50, width: 400, height: 200 };
export const BEAR_PEN_GATE = { x: 300, y: 250, width: 100 };
export const CONVEYOR_TABLE = { x: 180, y: 380 };
export const CONVEYOR_BELT = { startX: 180, startY: 380, endX: 100, endY: 350, width: 30 };
export const SHREDDER = { x: 100, y: 350, width: 90, height: 75 };
export const STEAK_OUTPUT = { x: 100, y: 410 };
export const GRILL = { x: 550, y: 400, width: 75, height: 60 };
export const GRILL_OUTPUT = { x: 550, y: 460 };
export const SALES_COUNTER = { x: 350, y: 600, width: 250, height: 30 };
export const MONEY_PILE = { x: 400, y: 660 };
export const CUSTOMER_ROW_Y = 670;

// ─── Interaktions-Radien ─────────────────────────────────────────────────────
export const PICKUP_RADIUS = 25;
export const STATION_INTERACT_RADIUS = 35;
export const UPGRADE_INTERACT_RADIUS = 45;

// ─── Upgrade-Definitionen ────────────────────────────────────────────────────
import { UpgradeDefinition } from './types';

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'stronger_axe', name: 'Stärkere Axt', icon: 'axe',
    costs: [25, 60, 120], maxLevel: 3,
    position: { x: 350, y: 290 }, paidAmount: 0, currentLevel: 0,
    description: 'Mehr Schaden gegen Wildschweine',
  },
  {
    id: 'bigger_backpack', name: 'Größerer Rucksack', icon: 'backpack',
    costs: [40, 90, 180], maxLevel: 3,
    position: { x: 350, y: 440 }, paidAmount: 0, currentLevel: 0,
    description: 'Mehr Tragekapazität',
  },
  {
    id: 'faster_shoes', name: 'Schnellere Schuhe', icon: 'shoe',
    costs: [30, 80], maxLevel: 2,
    position: { x: 250, y: 440 }, paidAmount: 0, currentLevel: 0,
    description: 'Schneller laufen',
  },
  {
    id: 'better_conveyor', name: 'Schnelleres Band', icon: 'gear',
    costs: [50, 110], maxLevel: 2,
    position: { x: 140, y: 380 }, paidAmount: 0, currentLevel: 0,
    description: 'Räucherkammer schneller',
  },
  {
    id: 'better_grill', name: 'Besserer Grill', icon: 'flame',
    costs: [60, 130], maxLevel: 2,
    position: { x: 600, y: 440 }, paidAmount: 0, currentLevel: 0,
    description: 'Schneller räuchern, mehr Kapazität',
  },
  {
    id: 'more_customers', name: 'Mehr Kunden', icon: 'people',
    costs: [75, 150], maxLevel: 2,
    position: { x: 500, y: 600 }, paidAmount: 0, currentLevel: 0,
    description: 'Mehr und schnellere Kunden',
  },
  {
    id: 'auto_conveyor', name: 'Auto-Transport', icon: 'conveyor',
    costs: [250], maxLevel: 1,
    position: { x: 350, y: 500 }, paidAmount: 0, currentLevel: 0,
    description: 'Automatisches Band: Räucherkammer → Wickelstation',
  },
];
