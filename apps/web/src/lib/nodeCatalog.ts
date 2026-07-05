import { list } from '@vvs/syntax-registry';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import type { LibraryCategory } from '@/types/ui';
import type { FunctionSymbol, TargetLanguage } from '@/types/graph';

/** Core spawn categories from the unified registry (canonical pin ids). */
export function buildCoreCategories(
  currentGraphId: string,
  functions: FunctionSymbol[],
  filterPin?: import('@/types/graph').PinDefinition,
  options?: {
    environmentId?: string;
    environmentManifest?: ProjectEnvironmentManifest;
    targetLanguage?: TargetLanguage;
  }
): LibraryCategory[] {
  return list({
    currentGraphId,
    functions,
    filterPin,
    environmentId: options?.environmentId,
    environmentManifest: options?.environmentManifest,
    targetLanguage: options?.targetLanguage,
  }).map((cat) => ({
    name: cat.name,
    items: cat.items.map((item) => ({
      type: item.kindId,
      kindVersion: item.kindVersion,
      label: item.label,
      category: item.category,
      inputs: item.inputs,
      outputs: item.outputs,
      linkedGraphId: item.linkedGraphId,
      linkKind: item.linkKind,
      graphBinding: item.graphBinding,
    })),
  }));
}

/** @deprecated Use buildCoreCategories */
export const MOCK_CATEGORIES = buildCoreCategories('main', []);
