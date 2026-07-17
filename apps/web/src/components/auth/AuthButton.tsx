'use client';

import React, { useState } from 'react';
import { Loader2, LogIn, LogOut, UserRound } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { isAuthConfigured, isGitHubOAuthConfigured } from '@/lib/auth/session';
import { isHostedFeaturesEnabled } from '@/lib/hostedFeatures';
import { Tooltip } from '@/components/ui/Tooltip';

export function AuthButton() {
  const configured = isAuthConfigured() && isHostedFeaturesEnabled();
  const { user, loading, signIn, signUp, signOut, signInWithGitHub } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!configured) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setMessage(null);
    setMode('sign-in');
  };

  const openModal = () => {
    resetForm();
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
        setOpen(false);
        resetForm();
        return;
      }
      await signUp(email.trim(), password);
      setMessage('Check your email to confirm the account, then sign in.');
      setMode('sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setOpen(false);
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  const label = loading ? 'Account…' : user ? user.email ?? 'Signed in' : 'Sign in';

  return (
    <>
      <Tooltip content={user ? 'Cloud account' : 'Sign in for cloud save'} placement="bottom">
        <button
          type="button"
          onClick={openModal}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs transition-colors ${
            user
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
              : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : user ? (
            <UserRound size={13} />
          ) : (
            <LogIn size={13} />
          )}
          <span className="max-w-[140px] truncate">{label}</span>
        </button>
      </Tooltip>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-[400px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-zinc-100 font-semibold text-sm">
                {user ? 'Cloud account' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {user ? (
                <>
                  <p className="text-xs text-zinc-400">
                    Signed in as <span className="text-zinc-200">{user.email}</span>. Project API
                    calls include your access token.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-zinc-100 text-xs px-4 py-2 rounded font-medium transition-colors"
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Sign in with Supabase Auth (GoTrue). Your JWT is sent to the Go API for
                    user-scoped cloud save when Postgres is enabled.
                  </p>
                  {isGitHubOAuthConfigured() ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        setError(null);
                        void signInWithGitHub().catch((err) => {
                          setError(err instanceof Error ? err.message : 'GitHub sign-in failed');
                          setBusy(false);
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-zinc-100 text-xs px-4 py-2 rounded font-medium transition-colors"
                    >
                      Continue with GitHub
                    </button>
                  ) : (
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      GitHub OAuth: set GOTRUE_EXTERNAL_GITHUB_ENABLED and client credentials in
                      docker-compose, then NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true in .env.local.
                      Email/password works without GitHub for v1.
                    </p>
                  )}
                  <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                      />
                    </div>
                    {error ? <p className="text-xs text-red-400">{error}</p> : null}
                    {message ? <p className="text-xs text-emerald-400">{message}</p> : null}
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs px-4 py-2 rounded font-medium transition-colors"
                    >
                      {busy ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : mode === 'sign-in' ? (
                        <LogIn size={12} />
                      ) : null}
                      {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {mode === 'sign-in'
                      ? 'Need an account? Create one'
                      : 'Already have an account? Sign in'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
