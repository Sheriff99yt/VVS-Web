'use client';

import { registerPack, getRegisteredPacks, type SyntaxPackManifest } from '@vvs/syntax-packs';

/**
 * Reads accumulated custom/added packs from localStorage and registers them
 * in the `@vvs/syntax-packs` memory register at application startup.
 */
export function initializeCustomPacks(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem('vvs_accumulated_packs');
    if (!stored) return;

    const parsed = JSON.parse(stored) as SyntaxPackManifest[];
    const alreadyRegistered = getRegisteredPacks();

    for (const pack of parsed) {
      // Check if it's already registered to avoid duplicates
      const exists = alreadyRegistered.some(
        (p) => p.id === pack.id && p.version === pack.version
      );
      if (!exists) {
        registerPack(pack);
      }
    }
  } catch (err) {
    console.error('Failed to initialize custom syntax packs:', err);
  }
}
