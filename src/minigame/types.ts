// types.ts — Lokale Minigame TypeScript-Interfaces & Enums

export enum ItemType {
  RAW_MEAT = 'RAW_MEAT',
  STEAK = 'STEAK',
  GRILLED_STEAK = 'GRILLED_STEAK',
  MONEY = 'MONEY',
}

export enum GameStation {
  BEAR_PEN = 'BEAR_PEN',
  CONVEYOR_TABLE = 'CONVEYOR_TABLE',
  STEAK_OUTPUT = 'STEAK_OUTPUT',
  GRILL = 'GRILL',
  GRILL_OUTPUT = 'GRILL_OUTPUT',
  SALES_COUNTER = 'SALES_COUNTER',
  MONEY_PILE = 'MONEY_PILE',
}

export interface Position {
  x: number;
  y: number;
}

export interface PolarBear {
  id: string;
  position: Position;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnTimer: number;
  walkDirection: Position;
  walkTimer: number;
  idlePauseTimer: number;
  size: number;
}

export interface DroppedItem {
  id: string;
  type: ItemType;
  position: Position;
  collected: boolean;
}

export interface BackpackItem {
  id: string;
  type: ItemType;
}

export interface ConveyorItem {
  id: string;
  progress: number;
}

export interface ProcessingItem {
  id: string;
  progress: number;
}

export interface Customer {
  id: string;
  color: string;
  hasSteakInHand: boolean;
  happyTimer: number;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  icon: string;
  costs: number[];
  currentLevel: number;
  maxLevel: number;
  position: Position;
  paidAmount: number;
  description: string;
}

export interface FloatingText {
  id: string;
  text: string;
  position: Position;
  color: string;
  opacity: number;
  offsetY: number;
  fontSize: number;
}

export interface GameState {
  // Spieler
  playerPosition: Position;
  playerSpeed: number;
  playerDamage: number;
  backpack: BackpackItem[];
  backpackCapacity: number;
  currentItemType: ItemType | null;

  // Eisbären
  bears: PolarBear[];

  // Boden-Items
  droppedItems: DroppedItem[];

  // Verarbeitungskette
  conveyorItems: ConveyorItem[];
  shredderProcessing: ProcessingItem[];
  steakOutputPile: number;
  grillItems: ProcessingItem[];
  grillOutputPile: number;
  counterSteaks: number;
  moneyPileAmount: number;

  // Kunden
  customers: Customer[];
  customerBuyTimer: number;

  // Geld & Upgrades
  totalMoney: number;
  upgrades: UpgradeDefinition[];

  // Kampf
  attackCooldown: number;
  isAttacking: boolean;
  attackTarget: string | null;

  // UI / Effekte
  floatingTexts: FloatingText[];
  tutorialStep: number;

  // Meta
  gameActive: boolean;
  tickCount: number;
}

// ─── Action Types für useReducer ─────────────────────────────────────────────

export type GameAction =
  | { type: 'TICK'; joystickDx: number; joystickDy: number }
  | { type: 'SET_PLAYER_POSITION'; position: Position }
  | { type: 'RESET_GAME' };
