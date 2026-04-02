// app.config.js
// Dynamic Expo config — replaces app.json.
// Reads FITREALM_ENV from the shell environment and passes it into
// Constants.expoConfig.extra so environment.ts can detect it at runtime.

module.exports = ({ config }) => ({
  ...config,
  name: 'FitRealm',
  slug: 'fitrealm',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1A1A2E',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'de.timetogetswifty.fitrealm',
    usesAppleSignIn: true,
    infoPlist: {
      NSHealthShareUsageDescription:
        'FitRealm uses your health data to convert workouts into in-game resources.',
      NSHealthUpdateUsageDescription:
        'FitRealm records your fitness achievements.',
    },
  },
  android: {
    package: 'de.timetogetswifty.fitrealm',
    adaptiveIcon: {
      backgroundColor: '#1A1A2E',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-asset',
    'expo-font',
    'expo-localization',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
  ],
  // ── Environment passthrough ──────────────────────────────────────────────
  // FITREALM_ENV set in the shell (e.g. FITREALM_ENV=dev npx expo start)
  // gets embedded here and is readable via Constants.expoConfig.extra.FITREALM_ENV
  extra: {
    FITREALM_ENV: process.env.FITREALM_ENV ?? null,
    eas: {
      projectId: '33bc29d0-b3d7-4b56-906a-a87e74cdc40b',
    },
  },
});
