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

/** Per-family capability overrides persisted in project snapshot. */
export type CodegenCapabilities = Partial<Record<LanguageFamily, string[]>>;

export interface ResolveCodegenTargetOptions {
  capabilities?: CodegenCapabilities;
  syntaxPackLock?: SyntaxPackLock;
}

/** Resolve the active codegen target from UI language + optional overrides. */
export function resolveCodegenTarget(
  lang: TargetLanguage,
  options?: ResolveCodegenTargetOptions
): CodegenTarget | null {
  const family = targetLanguageToFamily(lang);
  if (!family) return null;

  const capabilities =
    options?.capabilities?.[family] ?? [...DEFAULT_CAPABILITIES[family]];
  const packLock = options?.syntaxPackLock?.[family];

  return { family, capabilities, packLock };
}

/** Known capability tags per language family (for UI toggles). */
export const FAMILY_CAPABILITY_OPTIONS: Record<
  LanguageFamily,
  { id: string; label: string }[]
> = {
  python: [
    { id: 'async', label: 'Async / await' },
    { id: 'type_hints', label: 'Type hints' },
  ],
  javascript: [
    { id: 'async', label: 'Async / await' },
    { id: 'es2020', label: 'ES2020' },
    { id: 'es2022', label: 'ES2022' },
  ],
  cpp: [{ id: 'cpp17', label: 'C++17' }],
  verse: [],
};
