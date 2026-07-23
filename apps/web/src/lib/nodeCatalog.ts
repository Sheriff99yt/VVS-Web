import { list } from '@vvs/syntax-registry';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import type { LibraryCategory, LibraryNodeTemplate } from '@/types/ui';
import type { FunctionSymbol, TargetLanguage } from '@/types/graph';

/** Stable React key for spawn menu rows (kindId alone is not unique for dynamic symbols). */
export function spawnMenuItemKey(item: LibraryNodeTemplate, index: number): string {
  const symbolId = item.linkedGraphId ?? item.graphBinding?.symbolId;
  if (symbolId) return `${item.type}:${symbolId}`;
  return `${item.type}:${item.label}:${index}`;
}

/** Core spawn categories from the unified registry (canonical pin ids). */
export function buildCoreCategories(
  currentGraphId: string,
  functions: FunctionSymbol[],
  filterPin?: import('@/types/graph').PinDefinition,
  options?: {
    events?: import('@/types/graph').ProjectEventDefinition[];
    functionsMissingDeclare?: FunctionSymbol[];
    eventsMissingDeclare?: import('@/types/graph').ProjectEventDefinition[];
    environmentId?: string;
    environmentManifest?: ProjectEnvironmentManifest;
    targetLanguage?: TargetLanguage;
    namingConvention?: 'global' | 'python' | 'javascript' | 'cpp' | 'verse' | 'gdscript' | 'rust' | 'csharp' | 'auto';
  }
): LibraryCategory[] {
  return list({
    currentGraphId,
    functions,
    events: options?.events,
    functionsMissingDeclare: options?.functionsMissingDeclare,
    eventsMissingDeclare: options?.eventsMissingDeclare,
    filterPin,
    environmentId: options?.environmentId,
    environmentManifest: options?.environmentManifest,
    targetLanguage: options?.targetLanguage,
    namingConvention: options?.namingConvention,
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
