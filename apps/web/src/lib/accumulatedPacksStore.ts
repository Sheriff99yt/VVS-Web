'use client';

import { listSyntaxPacks, registerPack, type SyntaxPackManifest } from '@vvs/syntax-packs';

const ACCUMULATED_PACKS_STORAGE_KEY = 'vvs_accumulated_packs';

/**
 * Load all accumulated syntax packs (built-ins + custom accumulated from localStorage).
 */
export function getAccumulatedPackPool(): SyntaxPackManifest[] {
  const defaultPacks = listSyntaxPacks();
  if (typeof window === 'undefined') return defaultPacks;

  try {
    const stored = localStorage.getItem(ACCUMULATED_PACKS_STORAGE_KEY);
    if (!stored) return defaultPacks;

    const parsed = JSON.parse(stored) as SyntaxPackManifest[];
    const merged = [...defaultPacks];
    for (const pack of parsed) {
      if (!merged.some((p) => p.id === pack.id && p.version === pack.version)) {
        merged.push(pack);
      }
    }
    return merged;
  } catch (err) {
    console.error('Failed to load accumulated pack pool:', err);
    return defaultPacks;
  }
}

/**
 * Persist an updated pack pool to localStorage and register any new manifests in memory.
 */
export function saveAccumulatedPackPool(updatedPool: SyntaxPackManifest[]): void {
  if (typeof window === 'undefined') return;

  const defaultPacks = listSyntaxPacks();
  const customPacks = updatedPool.filter(
    (p) => !defaultPacks.some((def) => def.id === p.id && def.version === p.version)
  );

  try {
    localStorage.setItem(ACCUMULATED_PACKS_STORAGE_KEY, JSON.stringify(customPacks));
  } catch (err) {
    console.error('Failed to save accumulated syntax packs to localStorage:', err);
  }

  for (const pack of customPacks) {
    registerPack(pack);
  }
}

/**
 * Add a newly downloaded pack manifest to the accumulated pool.
 */
export function addPackToPool(manifest: SyntaxPackManifest): SyntaxPackManifest[] {
  const currentPool = getAccumulatedPackPool();
  const exists = currentPool.some((p) => p.id === manifest.id && p.version === manifest.version);
  if (exists) return currentPool;

  const updated = [...currentPool, manifest];
  saveAccumulatedPackPool(updated);
  return updated;
}
