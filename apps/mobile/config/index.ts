export type PlaidEnvironment = 'sandbox' | 'development' | 'production';

export interface AppConfig {
  apiBaseUrl: string;
  plaidEnvironment: PlaidEnvironment;
  appScheme: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
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
  plaidEnvironment: 'sandbox',
  appScheme: 'financeinterceptor',
  supabaseUrl: getSupabaseUrl(),
  supabaseAnonKey: getSupabaseAnonKey(),
};

validateConfig(config);
