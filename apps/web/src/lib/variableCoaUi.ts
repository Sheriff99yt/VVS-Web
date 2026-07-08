import type {
  CrossOverArchitectureMode,
  TargetLanguage,
  VariableBinding,
  VariableDataType,
} from '@vvs/graph-types';
import { portabilityFeaturesForDataType } from '@vvs/graph-types';
import {
  featuresSupportedInAllLanguages,
  isFeatureUnsupportedForLanguage,
} from '@vvs/language-profiles';
import { isCoaAuthoringActive } from '@/lib/coaPolicy';

export function coaLanguages(mode: CrossOverArchitectureMode | undefined): TargetLanguage[] {
  if (!isCoaAuthoringActive(mode)) return [];
  return mode!.allowedLanguages;
}

export function isBindingCoaAllowed(
  binding: VariableBinding,
  mode: CrossOverArchitectureMode | undefined
): boolean {
  if (!isCoaAuthoringActive(mode)) return true;
  if (binding === 'instance') return true;
  const feature = binding === 'static' ? 'variable.static' : 'variable.module';
  return mode!.allowedLanguages.every(
    (lang) => !isFeatureUnsupportedForLanguage(feature, lang)
  );
}

export function isDataTypeCoaAllowed(
  type: VariableDataType,
  mode: CrossOverArchitectureMode | undefined
): boolean {
  if (!isCoaAuthoringActive(mode)) return true;
  const features = portabilityFeaturesForDataType(type);
  if (features.length === 0) return true;
  return features.every((feature) =>
    mode!.allowedLanguages.every((lang) => !isFeatureUnsupportedForLanguage(feature, lang))
  );
}

export function isReadonlyCoaAllowed(mode: CrossOverArchitectureMode | undefined): boolean {
  if (!isCoaAuthoringActive(mode)) return true;
  return mode!.allowedLanguages.every(
    (lang) => !isFeatureUnsupportedForLanguage('variable.readonly', lang)
  );
}

export function coaSafeFeatureCount(mode: CrossOverArchitectureMode | undefined): number {
  if (!isCoaAuthoringActive(mode)) return 0;
  return featuresSupportedInAllLanguages(mode!.allowedLanguages).length;
}

export function coaLanguageLabel(mode: CrossOverArchitectureMode | undefined): string {
  if (!isCoaAuthoringActive(mode)) return '';
  return mode!.allowedLanguages.join(' · ');
}
