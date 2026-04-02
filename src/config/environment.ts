// environment.ts
// FitRealm — Environment detection and Supabase config per environment.

import Constants from 'expo-constants';

export type Environment = 'local' | 'dev' | 'production';

export interface EnvironmentConfig {
  env: Environment;
  supabaseUrl: string;
  supabaseAnonKey: string;
  authCallbackScheme: string;
  allowMockData: boolean;
  verboseLogging: boolean;
}

const LOCAL_CONFIG: EnvironmentConfig = {
  env: 'local',
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  authCallbackScheme: 'exp://localhost:8081',
  allowMockData: true,
  verboseLogging: true,
};

const DEV_CONFIG: EnvironmentConfig = {
  env: 'dev',
  supabaseUrl: 'https://TODO_DEV_PROJECT.supabase.co',    // TODO: Replace with dev project URL
  supabaseAnonKey: 'TODO_DEV_ANON_KEY',                    // TODO: Replace with dev anon key
  authCallbackScheme: 'fitrealm://auth/callback',
  allowMockData: true,
  verboseLogging: true,
};

const PROD_CONFIG: EnvironmentConfig = {
  env: 'production',
  supabaseUrl: 'https://TODO_PROD_PROJECT.supabase.co',   // TODO: Replace with prod project URL
  supabaseAnonKey: 'TODO_PROD_ANON_KEY',                   // TODO: Replace with prod anon key
  authCallbackScheme: 'com.fitrealm.app://auth/callback',
  allowMockData: false,
  verboseLogging: false,
};

function detectEnvironment(): Environment {
  // 1. Explicit override via Expo config or env var
  const explicit =
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.FITREALM_ENV ??
    process.env.FITREALM_ENV;

  if (explicit === 'local' || explicit === 'dev' || explicit === 'production') {
    return explicit;
  }

  // 2. Fallback: __DEV__ → local, else production
  return __DEV__ ? 'local' : 'production';
}

const CONFIGS: Record<Environment, EnvironmentConfig> = {
  local: LOCAL_CONFIG,
  dev: DEV_CONFIG,
  production: PROD_CONFIG,
};

export const ENV: Environment = detectEnvironment();
export const config: EnvironmentConfig = CONFIGS[ENV];
