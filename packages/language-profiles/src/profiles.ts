import type { PortabilityFeature, TargetLanguage } from '@vvs/graph-types';
import type { Diagnostic } from '@vvs/graph-types';

export interface LanguageProfile {
  id: TargetLanguage;
  displayName: string;
  capabilities: string[];
  native: PortabilityFeature[];
  emulated: PortabilityFeature[];
  unsupported: PortabilityFeature[];
}

export const LANGUAGE_PROFILES: Record<TargetLanguage, LanguageProfile> = {
  python: {
    id: 'python',
    displayName: 'Python',
    capabilities: ['async', 'type_hints'],
    native: [
      'function.module',
      'class.inheritance',
      'variable.module',
      'type.data_object',
      'type.data_array',
      'env.native',
    ],
    emulated: [
      'function.static',
      'function.async',
      'variable.static',
      'variable.readonly',
      'type.data_any',
    ],
    unsupported: ['function.overload', 'function.virtual', 'macro.inline'],
  },
  javascript: {
    id: 'javascript',
    displayName: 'JavaScript',
    capabilities: ['async', 'es2020'],
    native: [
      'function.static',
      'function.module',
      'function.async',
      'class.inheritance',
      'variable.static',
      'variable.module',
      'variable.readonly',
      'type.data_object',
      'type.data_array',
      'type.data_any',
      'env.native',
    ],
    emulated: ['function.overload'],
    unsupported: ['function.virtual', 'macro.inline'],
  },
  cpp: {
    id: 'cpp',
    displayName: 'C++',
    capabilities: ['cpp17'],
    native: [
      'function.static',
      'function.module',
      'function.overload',
      'function.virtual',
      'class.inheritance',
      'variable.static',
      'variable.module',
      'variable.readonly',
      'type.data_object',
      'type.data_array',
      'type.data_any',
      'env.native',
    ],
    emulated: ['function.async'],
    unsupported: ['macro.inline'],
  },
  verse: {
    id: 'verse',
    displayName: 'Verse',
    capabilities: [],
    native: [
      'function.module',
      'class.inheritance',
      'variable.module',
      'type.data_object',
      'env.native',
    ],
    emulated: [
      'function.static',
      'function.overload',
      'variable.static',
      'variable.readonly',
      'type.data_array',
      'type.data_any',
    ],
    unsupported: ['function.virtual', 'function.async', 'macro.inline'],
  },
  gdscript: {
    id: 'gdscript',
    displayName: 'GDScript',
    capabilities: ['typed'],
    native: [
      'function.static',
      'function.module',
      'class.inheritance',
      'variable.module',
      'variable.static',
      'type.data_object',
      'type.data_array',
      'env.native',
    ],
    emulated: [
      'function.async',
      'variable.readonly',
      'type.data_any',
    ],
    unsupported: ['function.overload', 'function.virtual', 'macro.inline'],
  },
  rust: {
    id: 'rust',
    displayName: 'Rust',
    capabilities: ['edition2021'],
    native: [
      'function.static',
      'function.module',
      'class.inheritance',
      'variable.module',
      'variable.static',
      'variable.readonly',
      'type.data_object',
      'type.data_array',
      'env.native',
    ],
    emulated: ['function.async', 'type.data_any'],
    unsupported: ['function.overload', 'function.virtual', 'macro.inline'],
  },
  csharp: {
    id: 'csharp',
    displayName: 'C#',
    capabilities: ['dotnet8'],
    native: [
      'function.static',
      'function.module',
      'function.async',
      'class.inheritance',
      'variable.module',
      'variable.static',
      'variable.readonly',
      'type.data_object',
      'type.data_array',
      'type.data_any',
      'env.native',
    ],
    emulated: ['function.overload'],
    unsupported: ['function.virtual', 'macro.inline'],
  },
  json: {
    id: 'json',
    displayName: 'JSON',
    capabilities: [],
    native: ['type.data_object', 'type.data_array'],
    emulated: [],
    unsupported: [
      'function.static',
      'function.overload',
      'function.module',
      'function.virtual',
      'function.async',
      'macro.inline',
      'variable.static',
      'variable.module',
      'variable.readonly',
      'type.data_any',
      'event.multicast',
      'env.native',
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
  'macro.inline': 'Macro inline expansion is deprecated — use Function + Call (text-shaped graphs).',
  'variable.static': 'Static fields are not native for this target — may emit as class or module scope.',
  'variable.module': 'Module-level variables may map differently per language.',
  'variable.readonly': 'Read-only variables may not enforce immutability in generated code for this target.',
  'type.data_object': 'Object/dict variables have limited or emulated support on this target.',
  'type.data_array': 'List/array variables have limited or emulated support on this target.',
  'type.data_any': 'Loosely typed (Any) variables are weak or unsupported on strict targets.',
  'event.multicast': 'Multicast event binding is not yet supported for this target.',
  'env.native': 'Environment manifest natives may be unavailable when switching codegen target.',
};

export function getLanguageProfile(language: TargetLanguage): LanguageProfile {
  return LANGUAGE_PROFILES[language];
}

export function isFeatureUnsupportedForLanguage(
  feature: PortabilityFeature,
  targetLanguage: TargetLanguage
): boolean {
  const profile = getLanguageProfile(targetLanguage);
  return profile.unsupported.includes(feature);
}

export function analyzePortability(
  features: PortabilityFeature[],
  targetLanguage: TargetLanguage,
  options?: { includeEmulated?: boolean }
): Diagnostic[] {
  const profile = getLanguageProfile(targetLanguage);
  const diagnostics: Diagnostic[] = [];
  const includeEmulated = options?.includeEmulated !== false;

  for (const feature of features) {
    if (profile.native.includes(feature) || profile.emulated.includes(feature)) {
      if (includeEmulated && profile.emulated.includes(feature)) {
        diagnostics.push({
          level: 'warning',
          code: `PORTABILITY_${feature.toUpperCase().replace(/\./g, '_')}`,
          message: `Emulated emit (${profile.displayName}): ${WARNING_MESSAGES[feature]}`,
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
