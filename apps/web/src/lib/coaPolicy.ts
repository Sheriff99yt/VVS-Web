import type { CrossOverArchitectureMode } from '@vvs/graph-types';

/**
 * Cross Over Architecture (multi-language authoring + multi-emit) is deferred.
 * Keep language profiles + single-target portability warnings shipped.
 * See docs/design/unified_symbol_model.md and docs/language_profiles.md.
 */
export const COA_SHIPPED = false;

/** Runtime COA mode — forced off until COA_SHIPPED is true. */
export function effectiveCrossOverMode(
  mode: CrossOverArchitectureMode
): CrossOverArchitectureMode {
  if (!COA_SHIPPED) {
    return { ...mode, enabled: false };
  }
  return mode;
}

export function isCoaAuthoringActive(mode: CrossOverArchitectureMode | undefined): boolean {
  if (!COA_SHIPPED || !mode?.enabled) return false;
  return mode.allowedLanguages.length > 0;
}
