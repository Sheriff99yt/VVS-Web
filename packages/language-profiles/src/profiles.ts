import type { PortabilityFeature, TargetLanguage } from '@vvs/graph-types';
import type { Diagnostic } from '@vvs/graph-types';

export interface LanguageProfile {
  id: TargetLanguage;
  displayName: string;
  native: PortabilityFeature[];
  emulated: PortabilityFeature[];
  unsupported: PortabilityFeature[];
}

export const LANGUAGE_PROFILES: Record<TargetLanguage, LanguageProfile> = {
  python: {
    id: 'python',
    displayName: 'Python',
    native: ['function.module', 'macro.inline', 'class.inheritance'],
    emulated: ['function.static', 'function.async'],
    unsupported: ['function.overload', 'function.virtual'],
  },
  javascript: {
    id: 'javascript',
    displayName: 'JavaScript',
    native: ['function.static', 'function.module', 'function.async', 'macro.inline', 'class.inheritance'],
    emulated: ['function.overload'],
    unsupported: ['function.virtual'],
  },
  cpp: {
    id: 'cpp',
    displayName: 'C++',
    native: [
      'function.static',
      'function.module',
      'function.overload',
      'function.virtual',
      'class.inheritance',
      'variable.static',
    ],
    emulated: ['function.async', 'macro.inline'],
    unsupported: [],
  },
  verse: {
    id: 'verse',
    displayName: 'Verse',
    native: ['function.module', 'class.inheritance', 'macro.inline'],
    emulated: ['function.static', 'function.overload'],
    unsupported: ['function.virtual', 'function.async'],
  },
  json: {
    id: 'json',
    displayName: 'JSON',
    native: [],
    emulated: [],
    unsupported: [
      'function.static',
      'function.overload',
      'function.module',
      'function.virtual',
      'function.async',
      'class.inheritance',
      'macro.inline',
      'variable.static',
      'event.multicast',
    ],
  },
};

const WARNING_MESSAGES: Record<PortabilityFeature, string> = {
  'function.static': 'Static methods are not native in this target — emitter may use a module-level function.',
  'function.overload': 'Multiple overloads are not fully supported — consider default parameters.',
  'function.module': 'Module-scoped functions may map differently per language.',
  'function.virtual': 'Virtual/polymorphic methods are not supported for this target.',
  'function.async': 'Async functions are not supported for this target.',
  'class.inheritance': 'Class inheritance (extends) maps per language profile — verify generated output.',
  'macro.inline': 'Macro inlining behavior varies by target.',
  'variable.static': 'Static class fields are not native for this target.',
  'event.multicast': 'Multicast event binding is not yet supported for this target.',
};

export function getLanguageProfile(language: TargetLanguage): LanguageProfile {
  return LANGUAGE_PROFILES[language];
}

export function analyzePortability(
  features: PortabilityFeature[],
  targetLanguage: TargetLanguage
): Diagnostic[] {
  const profile = getLanguageProfile(targetLanguage);
  const diagnostics: Diagnostic[] = [];

  for (const feature of features) {
    if (profile.native.includes(feature) || profile.emulated.includes(feature)) {
      if (profile.emulated.includes(feature)) {
        diagnostics.push({
          level: 'warning',
          code: `PORTABILITY_${feature.toUpperCase().replace(/\./g, '_')}`,
          message: `${WARNING_MESSAGES[feature]} (emulated for ${profile.displayName})`,
          source: 'portability',
        });
      }
      continue;
    }
    if (profile.unsupported.includes(feature)) {
      diagnostics.push({
        level: 'warning',
        code: `PORTABILITY_${feature.toUpperCase().replace(/\./g, '_')}`,
        message: `${WARNING_MESSAGES[feature]} Not supported for ${profile.displayName}. See docs/language_profiles.md.`,
        source: 'portability',
      });
    }
  }

  return diagnostics;
}
