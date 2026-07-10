'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/auth/supabaseClient';
import {
  isAuthConfigured,
  notifyAuthChanged,
  setAccessToken,
} from '@/lib/auth/session';

export function useAuthSession() {
  const configured = isAuthConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      notifyAuthChanged();
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Auth is not configured');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Auth is not configured');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccessToken(null);
    setUser(null);
    notifyAuthChanged();
  }, []);

  const signInWithGitHub = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Auth is not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/editor` : undefined,
      },
    });
    if (error) throw error;
  }, []);

  return { configured, user, loading, signIn, signUp, signOut, signInWithGitHub };
}
