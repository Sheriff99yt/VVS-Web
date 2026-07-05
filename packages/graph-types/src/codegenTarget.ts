import type { TargetLanguage } from './symbols';

/** Language family for syntax pack resolution. */
export type LanguageFamily = 'python' | 'javascript' | 'cpp' | 'verse';

/** Pinned syntax pack versions in `.vvs/project.json`. */
export interface SyntaxPackLockEntry {
  base: string;
  overlays: string[];
}

export type SyntaxPackLock = Partial<Record<LanguageFamily, SyntaxPackLockEntry>>;

/** Resolved codegen target — family + capability tags + optional pack lock. */
export interface CodegenTarget {
  family: LanguageFamily;
  capabilities: string[];
  packLock?: SyntaxPackLockEntry;
}

export function targetLanguageToFamily(lang: TargetLanguage): LanguageFamily | null {
  if (lang === 'json') return null;
  return lang;
}

/** Default capability sets per UI target language (v1 mapping). */
export const DEFAULT_CAPABILITIES: Record<LanguageFamily, string[]> = {
  python: ['async', 'type_hints'],
  javascript: ['async', 'es2020'],
  cpp: ['cpp17'],
  verse: [],
};

export function defaultCodegenTarget(lang: TargetLanguage): CodegenTarget | null {
  const family = targetLanguageToFamily(lang);
  if (!family) return null;
  return {
    family,
    capabilities: [...DEFAULT_CAPABILITIES[family]],
  };
}
