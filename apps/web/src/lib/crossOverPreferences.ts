import type { CrossOverArchitectureMode, TargetLanguage } from '@vvs/graph-types';

const CROSS_OVER_KEY = 'vvs:cross-over-architecture';

export const COA_LANGUAGE_OPTIONS: { id: TargetLanguage; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'cpp', label: 'C++' },
  { id: 'verse', label: 'Verse' },
];

export const DEFAULT_CROSS_OVER_MODE: CrossOverArchitectureMode = {
  enabled: false,
  allowedLanguages: ['python', 'javascript', 'cpp'],
};

export function readCrossOverMode(): CrossOverArchitectureMode {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CROSS_OVER_MODE };
  }
  try {
    const raw = window.localStorage.getItem(CROSS_OVER_KEY);
    if (!raw) return { ...DEFAULT_CROSS_OVER_MODE };
    const parsed = JSON.parse(raw) as Partial<CrossOverArchitectureMode>;
    const allowed = Array.isArray(parsed.allowedLanguages)
      ? parsed.allowedLanguages.filter((l): l is TargetLanguage =>
          COA_LANGUAGE_OPTIONS.some((o) => o.id === l)
        )
      : DEFAULT_CROSS_OVER_MODE.allowedLanguages;
    return {
      enabled: parsed.enabled === true,
      allowedLanguages: allowed.length > 0 ? allowed : DEFAULT_CROSS_OVER_MODE.allowedLanguages,
    };
  } catch {
    return { ...DEFAULT_CROSS_OVER_MODE };
  }
}

export function writeCrossOverMode(mode: CrossOverArchitectureMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CROSS_OVER_KEY, JSON.stringify(mode));
}
