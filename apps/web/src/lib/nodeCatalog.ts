import { list } from '@vvs/syntax-registry';
import type { LibraryCategory } from '@/types/ui';
import type { FunctionSymbol } from '@/types/graph';

/** Core spawn categories from the unified registry (canonical pin ids). */
export function buildCoreCategories(
  currentGraphId: string,
  functions: FunctionSymbol[],
  filterPin?: import('@/types/graph').PinDefinition
): LibraryCategory[] {
  return list({ currentGraphId, functions, filterPin }).map((cat) => ({
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
