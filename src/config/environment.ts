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
  supabaseUrl: 'https://rcejpadwuxqmuitshknp.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZWpwYWR3dXhxbXVpdHNoa25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzA5NTUsImV4cCI6MjA5MDY0Njk1NX0.VLsgrha-AHTMu9WThN3crnaZ_HDThOM5uHXW7lczm_U',
  authCallbackScheme: 'fitrealm://auth/callback',
  allowMockData: true,
  verboseLogging: true,
};

const PROD_CONFIG: EnvironmentConfig = {
  env: 'production',
  supabaseUrl: 'https://wmeowghmxwkdsvwtjahy.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZW93Z2hteHdrZHN2d3RqYWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzA5NzksImV4cCI6MjA5MDY0Njk3OX0._SH4AOxVp-IheXwNpPEJuM-K9J-yyIBQDnzArGsAimc',
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
