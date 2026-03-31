// Building sprite index — isometric building PNGs (512×512, transparent background)
// • burg_level_1..5, schmiede_level_1 → original hand-crafted assets
// • All other entries → placeholder PNGs generated automatically.
//   Replace each file with a real render to upgrade that building's look.
//   File naming: {buildingType}_level_{1|2|3}.png

export const BuildingSprites = {
  // ── Rathaus (burg) — original assets, levels 1–5 ──────────────────────────
  burg_level_1: require('./burg_level_1.png'),
  burg_level_2: require('./burg_level_2.png'),
  burg_level_3: require('./burg_level_3.png'),
  burg_level_4: require('./burg_level_4.png'),
  burg_level_5: require('./burg_level_5.png'),

  // ── Holzfäller (schmiede) — original asset ────────────────────────────────
  schmiede_level_1: require('./schmiede_level_1.png'),

  // ── Holzfäller — Blender renders levels 1–4 ───────────────────────────────
  holzfaeller_level_1: require('./holzfaeller_level_1.png'),
  holzfaeller_level_2: require('./holzfaeller_level_2.png'),
  holzfaeller_level_3: require('./holzfaeller_level_3.png'),
  holzfaeller_level_4: require('./holzfaeller_level_4.png'),

  // ── Feld ──────────────────────────────────────────────────────────────────
  feld_level_1: require('./feld_level_1.png'),
  feld_level_2: require('./feld_level_2.png'),
  feld_level_3: require('./feld_level_3.png'),
  feld_level_4: require('./feld_level_4.png'),

  // ── Steinbruch ────────────────────────────────────────────────────────────
  steinbruch_level_1: require('./steinbruch_level_1.png'),
  steinbruch_level_2: require('./steinbruch_level_2.png'),
  steinbruch_level_3: require('./steinbruch_level_3.png'),
  steinbruch_level_4: require('./steinbruch_level_4.png'),

  // ── Proteinfarm ───────────────────────────────────────────────────────────
  proteinfarm_level_1: require('./proteinfarm_level_1.png'),
  proteinfarm_level_2: require('./proteinfarm_level_2.png'),
  proteinfarm_level_3: require('./proteinfarm_level_3.png'),
  proteinfarm_level_4: require('./proteinfarm_level_4.png'),

  // ── Kaserne ───────────────────────────────────────────────────────────────
  kaserne_level_1: require('./kaserne_level_1.png'),
  kaserne_level_2: require('./kaserne_level_2.png'),
  kaserne_level_3: require('./kaserne_level_3.png'),
  kaserne_level_4: require('./kaserne_level_4.png'),

  // ── Tempel ────────────────────────────────────────────────────────────────
  tempel_level_1: require('./tempel_level_1.png'),
  tempel_level_2: require('./tempel_level_2.png'),
  tempel_level_3: require('./tempel_level_3.png'),

  // ── Bibliothek ────────────────────────────────────────────────────────────
  bibliothek_level_1: require('./bibliothek_level_1.png'),
  bibliothek_level_2: require('./bibliothek_level_2.png'),
  bibliothek_level_3: require('./bibliothek_level_3.png'),

  // ── Marktplatz ────────────────────────────────────────────────────────────
  marktplatz_level_1: require('./marktplatz_level_1.png'),
  marktplatz_level_2: require('./marktplatz_level_2.png'),
  marktplatz_level_3: require('./marktplatz_level_3.png'),

  // ── Stammeshaus ───────────────────────────────────────────────────────────
  stammeshaus_level_1: require('./stammeshaus_level_1.png'),
  stammeshaus_level_2: require('./stammeshaus_level_2.png'),
  stammeshaus_level_3: require('./stammeshaus_level_3.png'),

  // ── Holzlager ─────────────────────────────────────────────────────────────
  holzlager_level_1: require('./holzlager_level_1.png'),
  holzlager_level_2: require('./holzlager_level_2.png'),
  holzlager_level_3: require('./holzlager_level_3.png'),
  holzlager_level_4: require('./holzlager_level_4.png'),

  // ── Steinlager ────────────────────────────────────────────────────────────
  steinlager_level_1: require('./steinlager_level_1.png'),
  steinlager_level_2: require('./steinlager_level_2.png'),
  steinlager_level_3: require('./steinlager_level_3.png'),

  // ── Nahrungslager ─────────────────────────────────────────────────────────
  nahrungslager_level_1: require('./nahrungslager_level_1.png'),
  nahrungslager_level_2: require('./nahrungslager_level_2.png'),
  nahrungslager_level_3: require('./nahrungslager_level_3.png'),

  // ── Wachturm ──────────────────────────────────────────────────────────────
  wachturm_level_1: require('./wachturm_level_1.png'),
  wachturm_level_2: require('./wachturm_level_2.png'),
  wachturm_level_3: require('./wachturm_level_3.png'),

  // ── Mauer ─────────────────────────────────────────────────────────────────
  mauer_level_1: require('./mauer_level_1.png'),
  mauer_level_2: require('./mauer_level_2.png'),
  mauer_level_3: require('./mauer_level_3.png'),

  // ── Stall ─────────────────────────────────────────────────────────────────
  stall_level_1: require('./stall_level_1.png'),
  stall_level_2: require('./stall_level_2.png'),
  stall_level_3: require('./stall_level_3.png'),
} as const;

export type BuildingSpriteKey = keyof typeof BuildingSprites;
