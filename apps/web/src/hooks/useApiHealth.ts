'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiMode, VvsApi } from '@/lib/api';

export type ApiHealthState = 'checking' | 'mock' | 'connected' | 'unreachable';

export function useApiHealth(pollMs = 30_000) {
  const apiMode = getApiMode();
  const [healthState, setHealthState] = useState<ApiHealthState>(
    apiMode === 'mock' ? 'mock' : 'checking'
  );
  const [serviceName, setServiceName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (apiMode === 'mock') {
      setHealthState('mock');
      setServiceName('local');
      return;
    }

    setHealthState('checking');
    try {
      const health = await VvsApi.getHealth();
      if (health.status === 'ok') {
        setHealthState('connected');
        setServiceName(health.service);
      } else {
        setHealthState('unreachable');
        setServiceName(null);
      }
    } catch {
      setHealthState('unreachable');
      setServiceName(null);
    }
  }, [apiMode]);

  useEffect(() => {
    void refresh();
    if (apiMode === 'http') {
      const id = window.setInterval(() => void refresh(), pollMs);
      return () => window.clearInterval(id);
    }
  }, [apiMode, pollMs, refresh]);

  return { apiMode, healthState, serviceName, refresh };
}
