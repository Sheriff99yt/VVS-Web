import { VVSNode, VVSEdge } from '@/types/graph';

export interface GraphTabMetadata {
  moduleName: string;
  extendsType: string;
  description: string;
}

export interface GraphDocument {
  nodes: VVSNode[];
  edges: VVSEdge[];
  metadata?: GraphTabMetadata;
}

export function defaultTabMetadata(tabType: 'main' | 'function' | 'macro', tabName: string): GraphTabMetadata {
  const cleanName = tabName.replace(/^Function:\s*/, '').replace(/^Macro:\s*/, '');
  return {
    moduleName: tabType === 'main' ? 'PlayerController' : cleanName || 'Graph',
    extendsType: '',
    description: '',
  };
}

export function withDefaultMetadata(
  doc: GraphDocument,
  tabType: 'main' | 'function' | 'macro',
  tabName: string
): GraphDocument {
  return {
    ...doc,
    metadata: doc.metadata ?? defaultTabMetadata(tabType, tabName),
  };
}

export function createFunctionGraph(name: string): GraphDocument {
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
    name
  );
}

export function createMacroGraph(name: string): GraphDocument {
  const inputId = `macro-in-${Date.now()}`;
  const outputId = `macro-out-${Date.now() + 1}`;
  return withDefaultMetadata(
    {
      nodes: [
      {
        id: inputId,
        type: 'vvs_standard_node',
        position: { x: 80, y: 120 },
        data: {
          label: `${name} Input`,
          category: 'Flow Control',
          inputs: [],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues: {},
        },
      },
      {
        id: outputId,
        type: 'vvs_standard_node',
        position: { x: 400, y: 120 },
        data: {
          label: `${name} Output`,
          category: 'Flow Control',
          inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
          outputs: [],
          inlineValues: {},
        },
      },
      ],
      edges: [],
    },
    'macro',
    name
  );
}

export function createDefaultGraphForTab(
  tabType: 'main' | 'function' | 'macro',
  tabName: string,
  fallback?: GraphDocument
): GraphDocument {
  if (fallback) return fallback;
  if (tabType === 'function') return createFunctionGraph(tabName);
  if (tabType === 'macro') return createMacroGraph(tabName);
  return { nodes: [], edges: [] };
}
