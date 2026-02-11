export type PlaidEnvironment = 'sandbox' | 'development' | 'production';

export interface AppConfig {
  apiBaseUrl: string;
  plaidEnvironment: PlaidEnvironment;
  appScheme: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn: string;
}

function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (__DEV__) {
    return 'http://localhost:8000';
  }

  return 'https://api.financeinterceptor.com';
}

function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
}

function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
}

function getPlaidEnvironment(): PlaidEnvironment {
  const env = process.env.EXPO_PUBLIC_PLAID_ENVIRONMENT;
  if (env === 'sandbox' || env === 'production') {
    return env;
  }
  return 'sandbox';
}

function validateConfig(cfg: AppConfig): void {
  if (!cfg.supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
  }
  if (!cfg.supabaseAnonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }
}

export const config: AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  plaidEnvironment: getPlaidEnvironment(),
  appScheme: 'financeinterceptor',
  supabaseUrl: getSupabaseUrl(),
  supabaseAnonKey: getSupabaseAnonKey(),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
};

validateConfig(config);
