import type { TargetLanguage } from '@vvs/graph-types';
import { isModifierEffective } from './modifierEffectiveness';

/** Whether a graph node affects codegen for the given target language. */
export type NodeEffectiveness = 'effective' | 'ineffective';

const IMPORT_KIND_IDS = new Set(['vvs.project.import_module', 'import_module']);

/** Languages that emit a real non-abstract Function Declare prototype (U82). */
const FUNCTION_DECLARE_PROTOTYPE_LANGS = new Set<string>(['cpp']);

const TARGET_LANGS = new Set<string>([
  'python',
  'javascript',
  'cpp',
  'verse',
  'gdscript',
  'rust',
  'csharp',
  'go',
  'json',
]);

export type NodeEffectivenessOptions = {
  /**
   * For `event_member_define`: whether a paired On handler exists on the graph.
   * When explicitly `false`, the Declare is ineffective (U66/U67).
   * When `true` or omitted, treated as effective (signature owned with On).
   */
  eventHasHandler?: boolean;
};

function isImportKind(kindId: string): boolean {
  return IMPORT_KIND_IDS.has(kindId) || kindId.startsWith('import_module_');
}

function isFunctionDeclareKind(kindId: string): boolean {
  return kindId === 'function_define';
}

function isEventDeclareKind(kindId: string): boolean {
  return kindId === 'event_member_define';
}

/** Coerce schema / dual-write booleans (reject string `"false"` as truthy). */
export function coercePropertyBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    return false;
  }
  return Boolean(value);
}

function isAbstractDeclare(properties: Record<string, unknown> | undefined | null): boolean {
  return coercePropertyBool(properties?.isAbstract);
}

/**
 * Abstract Function Declare is a real language construct only where the
 * `isAbstract` modifier is effective — single table, no parallel allow-list.
 */
function isAbstractDeclareNative(lang: string): boolean {
  if (!TARGET_LANGS.has(lang)) return false;
  return isModifierEffective(lang as TargetLanguage, 'isAbstract');
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

function applyLanguageGates(
  gates: string[],
  lang: string
): NodeEffectiveness {
  if (gates.length === 0) return 'effective';
  return gates.some((g) => g === lang) ? 'effective' : 'ineffective';
}

/**
 * Whether a node affects generated text for `targetLanguage`.
 *
 * - Import Module: optional `targetLanguages` gate (U66/U67).
 * - Function Declare (`function_define`): non-abstract effective only on C++ (U82).
 *   Abstract is effective only on languages with a real abstract/pure construct
 *   (C++ / C#); elsewhere U66 `(x)` + U67 dim (aligned with modifierEffectiveness).
 * - Event Declare (`event_member_define`): ineffective when `eventHasHandler` is false.
 */
export function nodeEffectiveness(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string,
  options?: NodeEffectivenessOptions
): NodeEffectiveness {
  const lang = targetLanguage.trim().toLowerCase();
  const gates = parseNodeTargetLanguages(properties);

  if (isImportKind(kindId)) {
    return applyLanguageGates(gates, lang);
  }

  if (isFunctionDeclareKind(kindId)) {
    if (isAbstractDeclare(properties)) {
      // Abstract only counts where the isAbstract modifier is effective (single table).
      if (!isAbstractDeclareNative(lang)) return 'ineffective';
      return applyLanguageGates(gates, lang);
    }
    // Non-abstract Declare → prototype only on C++ (U82); elsewhere (x) + dim.
    if (!FUNCTION_DECLARE_PROTOTYPE_LANGS.has(lang)) return 'ineffective';
    return applyLanguageGates(gates, lang);
  }

  if (isEventDeclareKind(kindId)) {
    if (options?.eventHasHandler === false) return 'ineffective';
    return 'effective';
  }

  return 'effective';
}

export function isNodeEffectiveForLanguage(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string,
  options?: NodeEffectivenessOptions
): boolean {
  return nodeEffectiveness(kindId, properties, targetLanguage, options) === 'effective';
}

export function nodeIneffectiveTooltip(
  kindId: string,
  properties: Record<string, unknown> | undefined | null,
  targetLanguage: string,
  options?: NodeEffectivenessOptions
): string {
  if (isNodeEffectiveForLanguage(kindId, properties, targetLanguage, options)) return '';
  const gates = parseNodeTargetLanguages(properties);
  const lang = (targetLanguage.trim() || 'this language') as TargetLanguage | string;
  if (gates.length > 0) {
    return `Not emitted for ${lang} — gated to ${gates.join(', ')}`;
  }
  if (isEventDeclareKind(kindId) && options?.eventHasHandler === false) {
    return `Declare is not emitted until an On handler is placed — no method without On`;
  }
  if (isFunctionDeclareKind(kindId)) {
    if (isAbstractDeclare(properties) && !isAbstractDeclareNative(String(lang).toLowerCase())) {
      return `Abstract Declare is not emitted for ${lang} — no abstract/pure construct (body would need Define)`;
    }
    return `Declare is not emitted for ${lang} — no separate prototype (body is on Define)`;
  }
  return `Not used in ${lang} output`;
}
