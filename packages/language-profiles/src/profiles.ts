import type { PortabilityFeature, TargetLanguage } from '@vvs/graph-types';
import type { Diagnostic } from '@vvs/graph-types';
import pythonProfile from './packs/python.profile.json';
import javascriptProfile from './packs/javascript.profile.json';
import cppProfile from './packs/cpp.profile.json';
import verseProfile from './packs/verse.profile.json';
import gdscriptProfile from './packs/gdscript.profile.json';
import rustProfile from './packs/rust.profile.json';
import csharpProfile from './packs/csharp.profile.json';
import goProfile from './packs/go.profile.json';
import jsonProfile from './packs/json.profile.json';

export interface LanguageProfile {
  id: TargetLanguage;
  displayName: string;
  capabilities: string[];
  native: PortabilityFeature[];
  emulated: PortabilityFeature[];
  unsupported: PortabilityFeature[];
}

export const LANGUAGE_PROFILES: Record<TargetLanguage, LanguageProfile> = {
  python: pythonProfile as LanguageProfile,
  javascript: javascriptProfile as LanguageProfile,
  cpp: cppProfile as LanguageProfile,
  verse: verseProfile as LanguageProfile,
  gdscript: gdscriptProfile as LanguageProfile,
  rust: rustProfile as LanguageProfile,
  csharp: csharpProfile as LanguageProfile,
  go: goProfile as LanguageProfile,
  json: jsonProfile as LanguageProfile,
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
