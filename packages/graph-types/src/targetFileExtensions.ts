import type { TargetLanguage } from './symbols';

/** Supported file extensions per codegen target (without leading dot). */
export const TARGET_FILE_EXTENSIONS: Record<TargetLanguage, readonly string[]> = {
  python: ['py', 'pyi', 'pyw'],
  javascript: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx'],
  cpp: ['cpp', 'cc', 'cxx', 'c', 'h', 'hpp', 'hxx', 'hh'],
  verse: ['verse'],
  gdscript: ['gd'],
  rust: ['rs'],
  csharp: ['cs'],
  json: ['json'],
};

export const DEFAULT_TARGET_FILE_EXTENSION: Record<TargetLanguage, string> = {
  python: 'py',
  javascript: 'js',
  cpp: 'cpp',
  verse: 'verse',
  gdscript: 'gd',
  rust: 'rs',
  csharp: 'cs',
  json: 'json',
};

export type TargetFileExtensions = Partial<Record<TargetLanguage, string>>;

export function normalizeTargetFileExtensions(
  raw: unknown,
  fallback: TargetFileExtensions = {}
): TargetFileExtensions {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const next: TargetFileExtensions = { ...fallback };
  for (const [lang, ext] of Object.entries(raw as Record<string, unknown>)) {
    if (!(lang in TARGET_FILE_EXTENSIONS)) continue;
    if (typeof ext !== 'string' || !ext.trim()) continue;
    const language = lang as TargetLanguage;
    const normalized = ext.replace(/^\./, '').toLowerCase();
    if (TARGET_FILE_EXTENSIONS[language].includes(normalized)) {
      next[language] = normalized;
    }
  }
  return next;
}

export function resolveTargetFileExtension(
  language: TargetLanguage,
  overrides?: TargetFileExtensions
): string {
  const picked = overrides?.[language];
  if (picked && TARGET_FILE_EXTENSIONS[language].includes(picked)) {
    return picked;
  }
  return DEFAULT_TARGET_FILE_EXTENSION[language];
}

export function formatTargetFileExtension(ext: string): string {
  return ext.startsWith('.') ? ext : `.${ext}`;
}
