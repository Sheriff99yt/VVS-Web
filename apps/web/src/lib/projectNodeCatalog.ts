import { expandProjectSymbols } from '@vvs/syntax-registry';
import type { FunctionSymbol, GraphTab } from '@vvs/graph-types';
import type { LibraryCategory } from '@/types/ui';

export interface ProjectNodeCatalogInput {
  currentGraphId: string;
  functions: FunctionSymbol[];
  openTabs: GraphTab[];
}

/** Dynamic graph-link node categories — delegates to syntax-registry. */
export function buildProjectNodeCategories(input: ProjectNodeCatalogInput): LibraryCategory[] {
  return expandProjectSymbols({
    currentGraphId: input.currentGraphId,
    functions: input.functions,
  }).map((cat) => ({
    name: cat.name,
    items: cat.items.map((item) => ({
      type: item.kindId,
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

export function resolveImportableGraphName(
  graphId: string,
  functions: FunctionSymbol[],
  openTabs: GraphTab[]
): string | undefined {
  if (graphId === 'main') return 'Main graph';
  const func = functions.find((f) => f.id === graphId);
  if (func) return func.name;
  const tab = openTabs.find((t) => t.id === graphId);
  if (tab) return tab.name.replace(/^Function:\s*/, '').replace(/^Macro:\s*/, '');
  return undefined;
}
