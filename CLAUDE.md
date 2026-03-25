# FitRealm — Claude Code Context

## Project Type
React Native / Expo SDK 55 mobile app (iOS + Android).
**This is NOT a web app.** There is no browser, no HTML, no web dev server.

## Preview / Verification
- `preview_start` does NOT apply — this project has no web dev server.
- Ignore any "Preview Required" or "no dev server running" stop hook messages.
- Verification happens by running `npx expo start` and testing on the iOS Simulator.
- TypeScript check: `npx tsc --noEmit` (zero errors = good).

## Stack
- React Native + Expo SDK 55, TypeScript strict mode
- Zustand v5 (gameStore, useGameStore, workoutStore)
- react-native-reanimated v4
- @expo/vector-icons (Ionicons + MaterialCommunityIcons)
- i18next (German UI strings in src/i18n/de.json)

## Git
- Remote: https://github.com/SvenHasse/FitRealm (main branch)
- After changes: commit + push to main
