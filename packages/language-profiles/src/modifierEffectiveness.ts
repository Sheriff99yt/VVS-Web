import type { TargetLanguage } from '@vvs/graph-types';

export type ModifierEffectiveness = 'effective' | 'ineffective' | 'partial';

export type ModifierKey =
  | 'visibility'
  | 'binding'
  | 'isConst'
  | 'isVirtual'
  | 'isAbstract'
  | 'isOverride'
  | 'isAsync';

const TABLE: Record<ModifierKey, Partial<Record<TargetLanguage, ModifierEffectiveness>>> = {
  visibility: {
    cpp: 'effective',
    csharp: 'effective',
    python: 'ineffective',
    javascript: 'partial',
    rust: 'effective',
    gdscript: 'ineffective',
    verse: 'partial',
  },
  binding: {
    cpp: 'effective',
    csharp: 'effective',
    python: 'effective',
    javascript: 'effective',
    rust: 'effective',
    gdscript: 'effective',
    verse: 'ineffective',
  },
  isConst: {
    cpp: 'effective',
    csharp: 'effective',
    python: 'ineffective',
    javascript: 'ineffective',
    rust: 'effective',
    gdscript: 'ineffective',
    verse: 'partial',
  },
  isVirtual: {
    cpp: 'effective',
    csharp: 'effective',
    python: 'ineffective',
    javascript: 'ineffective',
    rust: 'ineffective',
    gdscript: 'ineffective',
    verse: 'ineffective',
  },
  isAbstract: {
    cpp: 'effective',
    csharp: 'effective',
    python: 'ineffective',
    javascript: 'ineffective',
    rust: 'ineffective',
    gdscript: 'ineffective',
    verse: 'ineffective',
  },
  isOverride: {
    cpp: 'effective',
    csharp: 'effective',
    python: 'ineffective',
    javascript: 'ineffective',
    rust: 'ineffective',
    gdscript: 'ineffective',
    verse: 'effective',
  },
  isAsync: {
    cpp: 'ineffective',
    csharp: 'effective',
    python: 'effective',
    javascript: 'effective',
    rust: 'effective',
    gdscript: 'ineffective',
    verse: 'ineffective',
  },
};

/** Whether a define-node modifier affects codegen for the given target language. */
export function modifierEffectiveness(
  lang: TargetLanguage,
  key: ModifierKey
): ModifierEffectiveness {
  return TABLE[key]?.[lang] ?? 'ineffective';
}

export function isModifierEffective(lang: TargetLanguage, key: ModifierKey): boolean {
  return modifierEffectiveness(lang, key) === 'effective';
}

/** Chip is clickable when the modifier affects codegen for this language (including partial). */
export function isModifierInteractive(lang: TargetLanguage, key: ModifierKey): boolean {
  return modifierEffectiveness(lang, key) !== 'ineffective';
}

export function modifierIneffectiveTooltip(lang: TargetLanguage, key: ModifierKey): string {
  const effect = modifierEffectiveness(lang, key);
  if (effect === 'effective') return '';
  if (effect === 'partial') {
    return `Limited support in ${lang} output — may not match all visibility options`;
  }
  const label = key === 'binding' ? 'Binding' : key.replace(/^is/, '');
  return `Not used in ${lang} output — changing ${label} has no effect`;
}
