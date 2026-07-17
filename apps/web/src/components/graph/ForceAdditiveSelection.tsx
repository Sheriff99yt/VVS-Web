'use client';

import { useEffect } from 'react';
import { useStoreApi } from '@xyflow/react';

/**
 * Keep React Flow in multi-select mode so plain left-click adds/toggles
 * like Ctrl/Cmd+click (U107). RF resets multiSelectionActive on keyup.
 */
export function ForceAdditiveSelection() {
  const store = useStoreApi();

  useEffect(() => {
    const force = () => {
      if (!store.getState().multiSelectionActive) {
        store.setState({ multiSelectionActive: true });
      }
    };
    force();
    const onKey = () => queueMicrotask(force);
    window.addEventListener('keyup', onKey);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('keydown', onKey);
    };
  }, [store]);

  return null;
}
