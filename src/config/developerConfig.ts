/**
 * developerConfig.ts
 *
 * ⚠️  NUR FÜR ENTWICKLUNG — VOR RELEASE LÖSCHEN ⚠️
 *
 * Alle Entwickler-Einstellungen an einem Ort.
 * Um Dev-Mode vollständig zu deaktivieren: diese Datei löschen
 * und alle Imports/Referenzen darauf entfernen.
 *
 * Release-Anleitung:
 *   1. Diese Datei löschen
 *   2. TypeScript-Fehler für fehlende DEV-Imports beheben
 *   3. Jede Stelle mit DEV.xxx durch den echten Wert/Logik ersetzen
 */

export const DEV = {
  // ─── HealthKit ────────────────────────────────────────────────────────────
  /**
   * true  → HealthKit wird umgangen, Mock-Werte werden genutzt
   * false → echte HealthKit-Daten (benötigt echtes Gerät + Permissions)
   */
  USE_MOCK_HEALTHKIT: true,

  /**
   * Mock-Werte statt HealthKit wenn USE_MOCK_HEALTHKIT = true.
   * 280 kcal / 32 min → Diät-Fokus = 280 MM (knapp unter Streak-Ziel 300)
   */
  MOCK_HEALTH_SNAPSHOT: {
    activeCaloriesToday: 280,    // aktive kcal (nicht Gesamt-kcal)
    workoutMinutesToday: 32,     // aktive Minuten mit Puls >50% HRmax
    stepsToday: 5200,
  },

  // ─── Game State ───────────────────────────────────────────────────────────
  /**
   * true  → App startet immer mit vordefinierten Mock-Werten (loadMockGameState)
   * false → normaler Spielstand aus AsyncStorage
   */
  USE_MOCK_GAME_STATE: false,

  /**
   * Vordefinierter Spielstand für schnelles Testing.
   * Wird nur verwendet wenn USE_MOCK_GAME_STATE = true.
   */
  MOCK_GAME_STATE: {
    muskelMasse: 850,
    protein: 12,
    currentStreak: 7,
    vitacoins: 500,
    dailyEffKcal: 0,
    dailyProteinEarned: 0,
  },

  // ─── Feature Flags ────────────────────────────────────────────────────────
  /**
   * Fokusziel-Sperre (14 Tage): true = Sperre aktiv, false = jederzeit änderbar
   * Im Dev-Mode auf false für ungehinderte Fokus-Tests
   */
  FOCUS_GOAL_LOCK_ENABLED: false,

  /**
   * true  → Ausführliche console.log Ausgaben (HealthKit, GameEngine, Store)
   * false → Keine Debug-Ausgaben
   */
  VERBOSE_LOGGING: true,

  // ─── Onboarding ───────────────────────────────────────────────────────────
  /**
   * true  → Onboarding wird bei jedem App-Start angezeigt (zum Testen)
   * false → Normales Verhalten (nur beim ersten Start)
   */
  FORCE_ONBOARDING: false,

  // ─── Freunde & Stamm ──────────────────────────────────────────────────────
  /**
   * true  → Mock-Freunde werden beim ersten Start automatisch geladen
   * false → Leere Freundesliste (Echtbetrieb)
   */
  USE_MOCK_FRIENDS: true,

  MOCK_FRIENDS: [
    {
      id: 'friend_1',
      name: 'Max',
      avatarColor: '#4A90D9',
      fitnessFocus: 'ausdauer' as const,
      currentStreak: 12,
      weeklyMM: 1840,
      totalMM: 24500,
      lastActiveAt: Date.now() - 1000 * 60 * 30, // 30 min ago
      hasStammeshaus: true,
    },
    {
      id: 'friend_2',
      name: 'Lisa',
      avatarColor: '#E8A838',
      fitnessFocus: 'diaet' as const,
      currentStreak: 5,
      weeklyMM: 2100,
      totalMM: 18200,
      lastActiveAt: Date.now() - 1000 * 60 * 60 * 25, // gestern
      hasStammeshaus: true,
    },
    {
      id: 'friend_3',
      name: 'Jonas',
      avatarColor: '#C0392B',
      fitnessFocus: 'muskelaufbau' as const,
      currentStreak: 3,
      weeklyMM: 950,
      totalMM: 9800,
      lastActiveAt: Date.now() - 1000 * 60 * 60 * 3, // 3h ago
      hasStammeshaus: false,
    },
  ],

  /** Persönlicher Einladecode für Mock-Betrieb */
  MOCK_INVITE_CODE: 'CORN42',
} as const;
