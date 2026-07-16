import type { TargetLanguage } from '@vvs/graph-types';

/** Whether a graph node affects codegen for the given target language. */
export type NodeEffectiveness = 'effective' | 'ineffective';

const IMPORT_KIND_IDS = new Set(['vvs.project.import_module', 'import_module']);

function isImportKind(kindId: string): boolean {
  return IMPORT_KIND_IDS.has(kindId) || kindId.startsWith('import_module_');
}

/** Normalize Import Module `targetLanguages` (comma string or string[]). */
export function parseNodeTargetLanguages(
  properties: Record<string, unknown> | undefined | null
): string[] {
  const raw = properties?.targetLanguages;
  if (Array.isArray(raw)) {
    return raw
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

/**
 * v1: Import Module with a non-empty `targetLanguages` gate is ineffective when
 * the current language is not in that list. All other kinds are effective
 * (registry portabilityFeatures can extend this later without changing call sites).
 */
export function nodeEffectiveness(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string
): NodeEffectiveness {
  if (!isImportKind(kindId)) return 'effective';
  const gates = parseNodeTargetLanguages(properties);
  if (gates.length === 0) return 'effective';
  const lang = targetLanguage.trim().toLowerCase();
  return gates.some((g) => g === lang) ? 'effective' : 'ineffective';
}

export function isNodeEffectiveForLanguage(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string
): boolean {
  return nodeEffectiveness(kindId, properties, targetLanguage) === 'effective';
}

export function nodeIneffectiveTooltip(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string
): string {
  if (isNodeEffectiveForLanguage(kindId, properties, targetLanguage)) return '';
  const gates = parseNodeTargetLanguages(properties);
  const lang = (targetLanguage.trim() || 'this language') as TargetLanguage | string;
  if (gates.length > 0) {
    return `Not emitted for ${lang} — gated to ${gates.join(', ')}`;
  }
  return `Not used in ${lang} output`;
}
