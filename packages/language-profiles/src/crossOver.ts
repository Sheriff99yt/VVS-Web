import type { Diagnostic, PortabilityFeature, TargetLanguage } from '@vvs/graph-types';
import {
  analyzePortability,
  getLanguageProfile,
  isFeatureUnsupportedForLanguage,
} from './profiles';

export interface VariablePortabilityEntry {
  symbolId: string;
  name: string;
  features: PortabilityFeature[];
}

/**
 * Per-variable portability warnings scoped to a symbol (compiler log + details panel).
 */
export function analyzeVariablePortabilityDiagnostics(
  variables: VariablePortabilityEntry[],
  targetLanguage: TargetLanguage
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const variable of variables) {
    for (const feature of variable.features) {
      const scoped = analyzePortability([feature], targetLanguage);
      for (const diagnostic of scoped) {
        diagnostics.push({
          ...diagnostic,
          symbolId: variable.symbolId,
          message: `Variable "${variable.name}": ${diagnostic.message}`,
        });
      }
    }
  }

  return diagnostics;
}

export interface CrossOverArchitectureMode {
  enabled: boolean;
  allowedLanguages: TargetLanguage[];
}

const ALL_FEATURES: PortabilityFeature[] = [
  'function.static',
  'function.overload',
  'function.module',
  'function.virtual',
  'function.async',
  'class.inheritance',
  'macro.inline',
  'variable.static',
  'variable.module',
  'variable.readonly',
  'type.data_object',
  'type.data_array',
  'type.data_any',
  'event.multicast',
];

function isFeatureCoaSafe(feature: PortabilityFeature, languages: TargetLanguage[]): boolean {
  if (languages.length === 0) return true;
  return languages.every((lang) => !isFeatureUnsupportedForLanguage(feature, lang));
}

/**
 * Cross Over Architecture validation — errors when project uses features that are not
 * supported (native or emulated) across every allowed language.
 */
export function analyzeCrossOverDiagnostics(
  mode: CrossOverArchitectureMode | undefined,
  projectFeatures: PortabilityFeature[],
  variables: VariablePortabilityEntry[]
): Diagnostic[] {
  if (!mode?.enabled || mode.allowedLanguages.length === 0) return [];

  const diagnostics: Diagnostic[] = [];
  const languages = mode.allowedLanguages;
  const languageLabel = languages.map((l) => getLanguageProfile(l).displayName).join(', ');

  const checkFeature = (
    feature: PortabilityFeature,
    context: string,
    symbolId?: string
  ) => {
    if (isFeatureCoaSafe(feature, languages)) return;
    const blocked = languages.filter((lang) =>
      isFeatureUnsupportedForLanguage(feature, lang)
    );
    const blockedNames = blocked.map((l) => getLanguageProfile(l).displayName).join(', ');
    diagnostics.push({
      level: 'error',
      code: `COA_${feature.toUpperCase().replace(/\./g, '_')}`,
      message: `${context}: feature "${feature}" is not Cross Over safe for [${languageLabel}] — blocked in ${blockedNames}. Change the graph or adjust COA languages.`,
      symbolId,
      source: 'portability',
    });
  };

  for (const feature of projectFeatures) {
    checkFeature(feature, 'Project');
  }

  for (const variable of variables) {
    for (const feature of variable.features) {
      checkFeature(feature, `Variable "${variable.name}"`, variable.symbolId);
    }
  }

  return diagnostics;
}

export function featuresSupportedInAllLanguages(
  languages: TargetLanguage[]
): PortabilityFeature[] {
  if (languages.length === 0) return ALL_FEATURES;
  return ALL_FEATURES.filter((feature) => isFeatureCoaSafe(feature, languages));
}

/** Capability intersection across allowed COA languages (syntax pack reuse). */
export function intersectCapabilities(languages: TargetLanguage[]): string[] {
  if (languages.length === 0) return [];
  const profiles = languages.map((l) => getLanguageProfile(l));
  return profiles.slice(1).reduce(
    (acc, profile) => acc.filter((cap) => profile.capabilities.includes(cap)),
    [...profiles[0]!.capabilities]
  );
}
