'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiMode, VvsApi } from '@/lib/api';
import { AUTH_CHANGED_EVENT } from '@/lib/auth/session';

export type ApiHealthState = 'checking' | 'mock' | 'connected' | 'unreachable';

export function useApiHealth(pollMs = 30_000) {
  const apiMode = getApiMode();
  const [healthState, setHealthState] = useState<ApiHealthState>(
    apiMode === 'mock' ? 'mock' : 'checking'
  );
  const [serviceName, setServiceName] = useState<string | null>(null);
  const [storeMode, setStoreMode] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await Promise.resolve(); // Yield to prevent synchronous state update in effect
    if (apiMode === 'mock') {
      setHealthState('mock');
      setServiceName('local');
      setStoreMode('memory');
      setAuthMode('dev');
      setUserId(null);
      return;
    }

    setHealthState('checking');
    try {
      const health = await VvsApi.getHealth();
      if (health.status === 'ok') {
        setHealthState('connected');
        setServiceName(health.service);
        setStoreMode(health.store ?? null);
        setAuthMode(health.auth ?? null);
        setUserId(health.userId ?? null);
      } else {
        setHealthState('unreachable');
        setServiceName(null);
        setStoreMode(null);
        setAuthMode(null);
        setUserId(null);
      }
    } catch {
      setHealthState('unreachable');
      setServiceName(null);
      setStoreMode(null);
      setAuthMode(null);
      setUserId(null);
    }
  }, [apiMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    if (apiMode === 'http') {
      const id = window.setInterval(() => void refresh(), pollMs);
      return () => window.clearInterval(id);
    }
  }, [apiMode, pollMs, refresh]);

  useEffect(() => {
    const onAuthChanged = () => void refresh();
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refresh]);

  return { apiMode, healthState, serviceName, storeMode, authMode, userId, refresh };
}
