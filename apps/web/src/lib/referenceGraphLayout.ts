import type { Node, Edge } from '@xyflow/react';
import type { GraphTab } from '@/contexts/ProjectContext';
import type { GraphReference, GraphReferenceEdges, GraphReferenceKind } from './graphRelations';
import { formatReferenceEndpoint } from './graphRelations';
import {
  REFERENCE_DEPTH_MAX,
  REFERENCE_DEPTH_MIN,
  type ReferenceGraphTypeFilter,
  type ReferenceTreeDirection,
  type ReferenceViewerDepths,
} from './referenceTree';

export interface ReferenceGraphNodeData extends Record<string, unknown> {
  label: string;
  graphType: 'main' | 'function' | 'macro';
  category: string;
  isRoot: boolean;
  /** UE-style column: referencers left, focus center, dependencies right */
  side: 'referencers' | 'root' | 'dependencies';
  depth: number;
}

const KIND_PIN: Record<GraphReferenceKind, string> = {
  calls: 'execution',
  imports: 'data_any',
  module_import: 'data_object',
  uses_variable: 'data_number',
  shared_event: 'data_string',
};

const GRAPH_CATEGORY: Record<'main' | 'function' | 'macro', string> = {
  main: 'Event Graph',
  function: 'Function',
  macro: 'Macro',
};

const TYPE_COLORS: Record<'main' | 'function' | 'macro', string> = {
  main: '#10b981',
  function: '#6366f1',
  macro: '#f59e0b',
};

function graphTypeFor(
  graphId: string,
  openTabs: GraphTab[],
  functions: { id: string; name: string }[]
): 'main' | 'function' | 'macro' {
  if (graphId === 'main') return 'main';
  const tab = openTabs.find((t) => t.id === graphId);
  if (tab?.type === 'macro') return 'macro';
  if (functions.some((f) => f.id === graphId)) return 'function';
  return 'function';
}

function clampDepth(depth: number): number {
  return Math.min(REFERENCE_DEPTH_MAX, Math.max(REFERENCE_DEPTH_MIN, depth));
}

type NodeSide = 'referencers' | 'root' | 'dependencies';

interface NodePlacement {
  side: NodeSide;
  depth: number;
}

/** BFS placement — referencers expand left, dependencies expand right (UE Reference Viewer). */
function assignUePlacements(
  rootId: string,
  index: Map<string, GraphReferenceEdges>,
  direction: ReferenceTreeDirection,
  depths: ReferenceViewerDepths
): Map<string, NodePlacement> {
  const placements = new Map<string, NodePlacement>();
  placements.set(rootId, { side: 'root', depth: 0 });

  const breadth = Math.max(1, depths.breadthLimit);

  const bfsSide = (side: 'referencers' | 'dependencies', maxDepth: number) => {
    const queue: { id: string; depth: number; path: Set<string> }[] = [
      { id: rootId, depth: 0, path: new Set([rootId]) },
    ];
    const perLevelCount = new Map<number, number>();

    while (queue.length > 0) {
      const { id, depth, path } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const edges =
        side === 'dependencies'
          ? (index.get(id)?.outgoing ?? [])
          : (index.get(id)?.incoming ?? []);

      const peers: string[] = [];
      for (const ref of edges) {
        const nextId = side === 'dependencies' ? ref.toGraphId : ref.fromGraphId;
        if (path.has(nextId) || nextId === rootId) continue;
        if (!peers.includes(nextId)) peers.push(nextId);
      }

      for (const nextId of peers) {
        const level = depth + 1;
        const count = perLevelCount.get(level) ?? 0;
        if (count >= breadth) continue;
        perLevelCount.set(level, count + 1);

        if (!placements.has(nextId)) {
          placements.set(nextId, { side, depth: level });
        }

        const nextPath = new Set(path);
        nextPath.add(id);
        queue.push({ id: nextId, depth: level, path: nextPath });
      }
    }
  };

  if (direction === 'dependencies' || direction === 'both') {
    bfsSide('dependencies', clampDepth(depths.dependencies));
  }
  if (direction === 'referencers' || direction === 'both') {
    bfsSide('referencers', clampDepth(depths.referencers));
  }

  return placements;
}

function placementRank(placement: NodePlacement): number {
  const sideBase = { referencers: 0, root: 100, dependencies: 200 };
  return sideBase[placement.side] + placement.depth;
}

function shouldDrawReferenceEdge(
  fromId: string,
  toId: string,
  placements: Map<string, NodePlacement>
): boolean {
  const from = placements.get(fromId);
  const to = placements.get(toId);
  if (!from || !to) return false;
  return placementRank(from) < placementRank(to);
}

function layoutUePositions(placements: Map<string, NodePlacement>): Map<string, { x: number; y: number }> {
  const columns = new Map<string, string[]>();

  for (const [graphId, placement] of placements) {
    const colKey =
      placement.side === 'root' ? 'root:0' : `${placement.side}:${placement.depth}`;
    if (!columns.has(colKey)) columns.set(colKey, []);
    columns.get(colKey)!.push(graphId);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const xGap = 320;
  const yGap = 150;

  for (const [, ids] of columns) {
    const sorted = [...ids].sort();
    const rowHeight = (sorted.length - 1) * yGap;

    sorted.forEach((graphId, i) => {
      const placement = placements.get(graphId)!;
      let x = 0;
      if (placement.side === 'referencers') x = -placement.depth * xGap;
      else if (placement.side === 'dependencies') x = placement.depth * xGap;

      positions.set(graphId, {
        x,
        y: i * yGap - rowHeight / 2,
      });
    });
  }

  return positions;
}

export function graphTypeAccent(graphType: 'main' | 'function' | 'macro'): string {
  return TYPE_COLORS[graphType];
}

export interface BuildReferenceFlowGraphOptions {
  rootId: string;
  index: Map<string, GraphReferenceEdges>;
  direction: ReferenceTreeDirection;
  depths: ReferenceViewerDepths;
  openTabs: GraphTab[];
  functions: { id: string; name: string }[];
  variableFilter?: string | null;
  typeFilters?: Set<ReferenceGraphTypeFilter>;
}

export function buildReferenceFlowGraph({
  rootId,
  index,
  direction,
  depths,
  openTabs,
  functions,
  variableFilter,
  typeFilters,
}: BuildReferenceFlowGraphOptions): { nodes: Node<ReferenceGraphNodeData>[]; edges: Edge[] } {
  const placements = assignUePlacements(rootId, index, direction, depths);
  let visibleIds = new Set(placements.keys());
  const positions = layoutUePositions(placements);

  if (variableFilter) {
    const varGraphIds = new Set(
      Array.from(index.keys()).filter((id) => {
        const edges = [...(index.get(id)?.outgoing ?? []), ...(index.get(id)?.incoming ?? [])];
        return edges.some(
          (ref) =>
            ref.kind === 'uses_variable' &&
            ref.label.replace(/^Shared variable:\s*/, '') === variableFilter
        );
      })
    );
    visibleIds = new Set([...visibleIds].filter((id) => varGraphIds.has(id)));
  }

  if (typeFilters && typeFilters.size > 0 && typeFilters.size < 3) {
    visibleIds = new Set(
      [...visibleIds].filter((id) => typeFilters.has(graphTypeFor(id, openTabs, functions)))
    );
    if (!visibleIds.has(rootId) && placements.has(rootId)) {
      visibleIds.add(rootId);
    }
  }

  const nodes: Node<ReferenceGraphNodeData>[] = Array.from(visibleIds).map((graphId) => {
    const graphType = graphTypeFor(graphId, openTabs, functions);
    const placement = placements.get(graphId) ?? { side: 'root' as const, depth: 0 };
    return {
      id: graphId,
      type: 'reference_graph_node',
      position: positions.get(graphId) ?? { x: 0, y: 0 },
      data: {
        label: formatReferenceEndpoint(graphId, openTabs, functions),
        graphType,
        category: GRAPH_CATEGORY[graphType],
        isRoot: graphId === rootId,
        side: placement.side,
        depth: placement.depth,
      },
    };
  });

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];

  const addEdge = (ref: GraphReference) => {
    if (!visibleIds.has(ref.fromGraphId) || !visibleIds.has(ref.toGraphId)) return;
    if (!shouldDrawReferenceEdge(ref.fromGraphId, ref.toGraphId, placements)) return;

    if (ref.kind === 'uses_variable' && variableFilter) {
      const varName = ref.label.replace(/^Shared variable:\s*/, '');
      if (varName !== variableFilter) return;
    }
    const key = `${ref.fromGraphId}->${ref.toGraphId}:${ref.kind}:${ref.label}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);

    let label = ref.label;
    if (ref.kind === 'uses_variable') {
      label = ref.label.replace(/^Shared variable:\s*/, '');
    }

    edges.push({
      id: key,
      source: ref.fromGraphId,
      target: ref.toGraphId,
      type: 'reference_graph_edge',
      label,
      data: { kind: ref.kind, pinType: KIND_PIN[ref.kind] },
    });
  };

  if (direction === 'dependencies' || direction === 'both') {
    for (const id of visibleIds) {
      for (const ref of index.get(id)?.outgoing ?? []) addEdge(ref);
    }
  }
  if (direction === 'referencers' || direction === 'both') {
    for (const id of visibleIds) {
      for (const ref of index.get(id)?.incoming ?? []) addEdge(ref);
    }
  }

  return { nodes, edges };
}

/** @deprecated Use buildReferenceFlowGraph with ReferenceViewerDepths */
export function buildReferenceFlowGraphLegacy(
  rootId: string,
  index: Map<string, GraphReferenceEdges>,
  direction: ReferenceTreeDirection,
  maxDepth: number,
  openTabs: GraphTab[],
  functions: { id: string; name: string }[],
  variableFilter?: string | null
): { nodes: Node<ReferenceGraphNodeData>[]; edges: Edge[] } {
  return buildReferenceFlowGraph({
    rootId,
    index,
    direction,
    depths: {
      referencers: maxDepth,
      dependencies: maxDepth,
      breadthLimit: 20,
    },
    openTabs,
    functions,
    variableFilter,
  });
}
