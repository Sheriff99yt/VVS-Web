'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readUiPreference,
  writeUiPreferences,
  type UiPreferences,
} from '@/lib/uiPreferences';

type PrefListener = () => void;
const listeners = new Set<PrefListener>();

function notifyUiPreferenceListeners(): void {
  for (const listener of listeners) listener();
}

/**
 * Synced UI preference — all consumers share one React-visible value via
 * localStorage + in-memory pub/sub (not local-only useState).
 */
export function useUiPreference<K extends keyof UiPreferences>(
  key: K
): [UiPreferences[K], (value: UiPreferences[K]) => void] {
  const [value, setValue] = useState(() => readUiPreference(key));

  useEffect(() => {
    const onChange = () => setValue(readUiPreference(key));
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [key]);

  const setPref = useCallback(
    (next: UiPreferences[K]) => {
      writeUiPreferences({ [key]: next } as Partial<UiPreferences>);
      setValue(next);
      notifyUiPreferenceListeners();
    },
    [key]
  );

  return [value, setPref];
}
