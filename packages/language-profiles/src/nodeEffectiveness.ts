import type { TargetLanguage } from '@vvs/graph-types';

/** Whether a graph node affects codegen for the given target language. */
export type NodeEffectiveness = 'effective' | 'ineffective';

const IMPORT_KIND_IDS = new Set(['vvs.project.import_module', 'import_module']);

/** Languages that emit a real non-abstract Function Declare prototype (U82). */
const FUNCTION_DECLARE_PROTOTYPE_LANGS = new Set<string>(['cpp']);

function isImportKind(kindId: string): boolean {
  return IMPORT_KIND_IDS.has(kindId) || kindId.startsWith('import_module_');
}

function isFunctionDeclareKind(kindId: string): boolean {
  return kindId === 'function_define';
}

function isAbstractDeclare(properties: Record<string, unknown> | undefined | null): boolean {
  return Boolean(properties?.isAbstract);
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
 * Whether a node affects generated text for `targetLanguage`.
 *
 * - Import Module: optional `targetLanguages` gate (U66/U67).
 * - Function Declare (`function_define`): non-abstract is effective only where a
 *   prototype is emitted (C++ / U82). Abstract remains effective (comment or `= 0`).
 * - Explicit `targetLanguages` on any of the above still gates when non-empty.
 */
export function nodeEffectiveness(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string
): NodeEffectiveness {
  const lang = targetLanguage.trim().toLowerCase();
  const gates = parseNodeTargetLanguages(properties);

  if (isImportKind(kindId)) {
    if (gates.length === 0) return 'effective';
    return gates.some((g) => g === lang) ? 'effective' : 'ineffective';
  }

  if (isFunctionDeclareKind(kindId)) {
    // Abstract Declare still emits (`# abstract` / `= 0`) on every target.
    if (isAbstractDeclare(properties)) {
      if (gates.length === 0) return 'effective';
      return gates.some((g) => g === lang) ? 'effective' : 'ineffective';
    }
    // Non-abstract Declare → prototype only on C++ (U82); elsewhere (x) + dim.
    if (!FUNCTION_DECLARE_PROTOTYPE_LANGS.has(lang)) return 'ineffective';
    if (gates.length === 0) return 'effective';
    return gates.some((g) => g === lang) ? 'effective' : 'ineffective';
  }

  return 'effective';
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
  if (isFunctionDeclareKind(kindId)) {
    return `Declare is not emitted for ${lang} — no separate prototype (body is on Define)`;
  }
  return `Not used in ${lang} output`;
}
