'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import type { LanguageFamily, SyntaxPackLock } from '@vvs/graph-types';
import type { SyntaxPackManifest } from '@vvs/syntax-packs';
import {
  getAccumulatedPackPool,
  addPackToPool,
  saveAccumulatedPackPool,
} from '@/lib/accumulatedPacksStore';

export interface UsePackRegistryResult {
  packPool: SyntaxPackManifest[];
  syntaxPackLock: SyntaxPackLock | undefined;
  setBasePackVersion: (family: LanguageFamily, baseVersionRef: string) => void;
  toggleOverlayVersion: (family: LanguageFamily, overlayRef: string) => void;
  installPackManifest: (manifest: SyntaxPackManifest) => void;
}

export function usePackRegistry(): UsePackRegistryResult {
  const { syntaxPackLock, setSyntaxPackLock } = useProject();
  const [packPool, setPackPool] = useState<SyntaxPackManifest[]>([]);

  useEffect(() => {
    setPackPool(getAccumulatedPackPool());
  }, []);

  const installPackManifest = useCallback((manifest: SyntaxPackManifest) => {
    const updated = addPackToPool(manifest);
    setPackPool(updated);
  }, []);

  const setBasePackVersion = useCallback(
    (family: LanguageFamily, baseVersionRef: string) => {
      setSyntaxPackLock((prev: SyntaxPackLock | undefined) => {
        const next: SyntaxPackLock = { ...prev };
        const current = next[family];
        next[family] = {
          base: baseVersionRef,
          overlays: current?.overlays ?? [],
        };
        return next;
      });
    },
    [setSyntaxPackLock]
  );

  const toggleOverlayVersion = useCallback(
    (family: LanguageFamily, overlayRef: string) => {
      setSyntaxPackLock((prev: SyntaxPackLock | undefined) => {
        const next: SyntaxPackLock = { ...prev };
        const current = next[family];
        const overlays = current?.overlays ?? [];
        const updatedOverlays = overlays.includes(overlayRef)
          ? overlays.filter((o) => o !== overlayRef)
          : [...overlays, overlayRef];

        next[family] = {
          base: current?.base ?? `${family}.base@1`,
          overlays: updatedOverlays,
        };
        return next;
      });
    },
    [setSyntaxPackLock]
  );

  return {
    packPool,
    syntaxPackLock,
    setBasePackVersion,
    toggleOverlayVersion,
    installPackManifest,
  };
}
