import { VVSNode, VVSEdge } from '@/types/graph';
import type { TargetLanguage } from '@vvs/graph-types';
import { codegenMetadataSeed, PROJECT_MAP_CONTAINER_NAME, type ProjectCodegenDefaults, type FunctionSymbol } from '@vvs/graph-types';
import { applyFunctionEntryBinding, applyFunctionReturnBinding } from './functionHelpers';

export interface GraphTabMetadata {
  moduleName: string;
  extendsType: string;
  description: string;
  targetLanguage?: TargetLanguage;
  targetFileExtension?: string;
}

const GRAPH_CODEGEN_METADATA_KEYS = new Set<keyof GraphTabMetadata>([
  'targetLanguage',
  'targetFileExtension',
]);

export function isCodegenMetadataPatch(patch: Partial<GraphTabMetadata>): boolean {
  const keys = Object.keys(patch) as (keyof GraphTabMetadata)[];
  return keys.length > 0 && keys.every((key) => GRAPH_CODEGEN_METADATA_KEYS.has(key));
}

export interface GraphDocument {
  nodes: VVSNode[];
  edges: VVSEdge[];
  metadata?: GraphTabMetadata;
}

export type { ProjectCodegenDefaults };

export function defaultTabMetadata(
  tabType: 'main' | 'function' | 'class' | 'container',
  tabName: string,
  codegenDefaults?: ProjectCodegenDefaults
): GraphTabMetadata {
  const cleanName = tabName.replace(/^Function:\s*/, '');
  return {
    moduleName:
      tabType === 'main'
        ? 'PlayerController'
        : tabType === 'container'
          ? cleanName || PROJECT_MAP_CONTAINER_NAME
          : cleanName || 'Graph',
    extendsType: '',
    description: '',
    ...(codegenDefaults ? codegenMetadataSeed(codegenDefaults) : {}),
  };
}

export function withDefaultMetadata(
  doc: GraphDocument,
  tabType: 'main' | 'function' | 'class' | 'container',
  tabName: string,
  codegenDefaults?: ProjectCodegenDefaults
): GraphDocument {
  return {
    ...doc,
    metadata: doc.metadata ?? defaultTabMetadata(tabType, tabName, codegenDefaults),
  };
}

export function createFunctionGraph(
  name: string,
  codegenDefaults?: ProjectCodegenDefaults,
  options?: { tabId?: string; functions?: FunctionSymbol[] }
): GraphDocument {
  let data: VVSNode['data'] = {
    label: name,
    category: 'Events',
    inputs: [],
    outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
    inlineValues: {},
  };

  let returnData: VVSNode['data'] | undefined;

  if (options?.tabId && options?.functions) {
    const parts = options.tabId.split('::');
    const funcId = parts[0];
    const overloadId = parts[1]; // may be undefined

    const func = options.functions.find(
      (f) => f.id === funcId || f.overloads.some((o) => o.graphTabId === options.tabId)
    );

    if (func) {
      let overload = overloadId
        ? func.overloads.find((o) => o.id === overloadId)
        : func.overloads.find((o) => o.graphTabId === options.tabId);

      if (!overload && func.overloads.length > 0) {
        overload = func.overloads[0];
      }

      data = applyFunctionEntryBinding(data, func, overload?.id);
      
      returnData = applyFunctionReturnBinding(
        {
          label: 'Return',
          category: 'Flow Control',
          inputs: [],
          outputs: [],
          inlineValues: {},
        },
        func,
        overload?.id
      );
    }
  }

  const entryId = `fn-entry-${Date.now()}`;
  const nodes: VVSNode[] = [
    {
      id: entryId,
      type: 'vvs_standard_node',
      position: { x: 80, y: 80 },
      data,
    },
  ];

  if (returnData) {
    nodes.push({
      id: `fn-return-${Date.now()}`,
      type: 'vvs_standard_node',
      position: { x: 400, y: 80 },
      data: returnData,
    });
  }

  return withDefaultMetadata(
    {
      nodes,
      edges: [],
    },
    'function',
    name,
    codegenDefaults
  );
}

export function createDefaultGraphForTab(
  tabType: 'main' | 'function' | 'container',
  tabName: string,
  fallback?: GraphDocument,
  codegenDefaults?: ProjectCodegenDefaults,
  options?: { tabId?: string; functions?: FunctionSymbol[] }
): GraphDocument {
  if (fallback) {
    return codegenDefaults
      ? withDefaultMetadata(fallback, tabType, tabName, codegenDefaults)
      : fallback;
  }
  if (tabType === 'function') return createFunctionGraph(tabName, codegenDefaults, options);
  return codegenDefaults
    ? withDefaultMetadata({ nodes: [], edges: [] }, tabType, tabName, codegenDefaults)
    : { nodes: [], edges: [] };
}
