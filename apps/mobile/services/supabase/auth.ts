import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';

import type { SignInCredentials, SignUpCredentials } from '@/types/auth';

import { supabase } from './client';

export class AuthError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new AuthError(error.message, error.status);
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new AuthError(error.message, error.status);
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthError(error.message, error.status);
  }
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }

  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }

  return data.user;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
