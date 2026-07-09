import { VVSNode, VVSEdge } from '@/types/graph';
import type { TargetLanguage, TargetFileExtensions } from '@vvs/graph-types';
import { codegenMetadataSeed, type ProjectCodegenDefaults } from '@vvs/graph-types';

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
          ? cleanName || 'Project map'
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
  codegenDefaults?: ProjectCodegenDefaults
): GraphDocument {
  const entryId = `fn-entry-${Date.now()}`;
  return withDefaultMetadata(
    {
      nodes: [
        {
          id: entryId,
          type: 'vvs_standard_node',
          position: { x: 80, y: 80 },
          data: {
            label: name,
            category: 'Events',
            inputs: [],
            outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
            inlineValues: {},
          },
        },
      ],
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
  codegenDefaults?: ProjectCodegenDefaults
): GraphDocument {
  if (fallback) {
    return codegenDefaults
      ? withDefaultMetadata(fallback, tabType, tabName, codegenDefaults)
      : fallback;
  }
  if (tabType === 'function') return createFunctionGraph(tabName, codegenDefaults);
  return codegenDefaults
    ? withDefaultMetadata({ nodes: [], edges: [] }, tabType, tabName, codegenDefaults)
    : { nodes: [], edges: [] };
}
