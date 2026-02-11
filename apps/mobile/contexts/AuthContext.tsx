import * as Sentry from '@sentry/react-native';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  getSession,
  onAuthStateChange,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  signUp as supabaseSignUp,
} from '@/services/supabase';
import type { AuthContextValue, AuthError, Session, User } from '@/types/auth';

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();

    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        Sentry.setUser({ id: newSession.user.id, email: newSession.user.email ?? undefined });
      } else {
        Sentry.setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await supabaseSignIn({ email, password });
      setSession(response.session);
      setUser(response.user);
      if (response.user) {
        Sentry.setUser({ id: response.user.id, email: response.user.email ?? undefined });
      }
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const response = await supabaseSignUp({ email, password });
      setSession(response.session);
      setUser(response.user);
      if (response.user) {
        Sentry.setUser({ id: response.user.id, email: response.user.email ?? undefined });
      }
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabaseSignOut();
      setSession(null);
      setUser(null);
      Sentry.setUser(null);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: user !== null && session !== null,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, isLoading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
