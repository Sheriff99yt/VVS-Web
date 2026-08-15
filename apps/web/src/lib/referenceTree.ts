import type { GraphReference, GraphReferenceEdges } from './graphRelations';

export type ReferenceTreeDirection = 'dependencies' | 'referencers' | 'both';

export const REFERENCE_DEPTH_MIN = 1;
export const REFERENCE_DEPTH_MAX = 10;
export const REFERENCE_DEPTH_DEFAULT = 2;

export const REFERENCE_BREADTH_MIN = 1;
export const REFERENCE_BREADTH_MAX = 40;
export const REFERENCE_BREADTH_DEFAULT = 20;

export type ReferenceGraphTypeFilter = 'main' | 'function' | 'macro';

export interface ReferenceViewerDepths {
  referencers: number;
  dependencies: number;
  breadthLimit: number;
}

export interface ReferenceTreeNode {
  graphId: string;
  depth: number;
  /** Edge from parent graph to this node */
  viaRef?: GraphReference;
  children: ReferenceTreeNode[];
  /** More links exist but were cut off by depth, breadth, or cycle */
  truncated?: boolean;
  /** Stopped because of a cycle back to an ancestor */
  cyclic?: boolean;
}

export interface ReferenceTreeResult {
  rootId: string;
  direction: ReferenceTreeDirection;
  maxDepth: number;
  /** Single root subtree when direction is dependencies or referencers */
  tree: ReferenceTreeNode;
  /** Second subtree when direction is both (referencers side) */
  referencersTree?: ReferenceTreeNode;
}

/**
 * Keep nodes whose label matches the query, plus ancestors needed for path context.
 * Empty query returns the tree unchanged.
 */
export function filterReferenceTreeByName(
  node: ReferenceTreeNode,
  query: string,
  labelFor: (graphId: string) => string
): ReferenceTreeNode | null {
  const q = query.trim().toLowerCase();
  if (!q) return node;

  const selfMatch = labelFor(node.graphId).toLowerCase().includes(q);
  const filteredChildren = node.children
    .map((child) => filterReferenceTreeByName(child, q, labelFor))
    .filter((c): c is ReferenceTreeNode => c != null);

  if (!selfMatch && filteredChildren.length === 0) return null;
  return { ...node, children: filteredChildren };
}

/**
 * Keep nodes whose graph type is in the typeFilters set, plus ancestors needed for path.
 * Empty set returns the tree unchanged.
 */
export function filterReferenceTreeByType(
  node: ReferenceTreeNode,
  typeFilters: Set<ReferenceGraphTypeFilter>,
  typeFor: (graphId: string) => ReferenceGraphTypeFilter
): ReferenceTreeNode | null {
  if (typeFilters.size === 0) return node;

  const selfMatch = typeFilters.has(typeFor(node.graphId));
  const filteredChildren = node.children
    .map((child) => filterReferenceTreeByType(child, typeFilters, typeFor))
    .filter((c): c is ReferenceTreeNode => c != null);

  if (!selfMatch && filteredChildren.length === 0) return null;
  return { ...node, children: filteredChildren };
}

function peerGraphId(ref: GraphReference, direction: 'dependencies' | 'referencers'): string {
  return direction === 'dependencies' ? ref.toGraphId : ref.fromGraphId;
}

function clampBreadth(breadthLimit: number): number {
  return Math.min(
    REFERENCE_BREADTH_MAX,
    Math.max(REFERENCE_BREADTH_MIN, breadthLimit)
  );
}

function buildSubtree(
  graphId: string,
  index: Map<string, GraphReferenceEdges>,
  direction: 'dependencies' | 'referencers',
  maxDepth: number,
  currentDepth: number,
  ancestorPath: Set<string>,
  breadthLimit: number = REFERENCE_BREADTH_DEFAULT,
  viaRef?: GraphReference
): ReferenceTreeNode {
  const edges =
    direction === 'dependencies'
      ? (index.get(graphId)?.outgoing ?? [])
      : (index.get(graphId)?.incoming ?? []);

  if (currentDepth >= maxDepth) {
    const hasHidden = edges.some((ref) => {
      const nextId = peerGraphId(ref, direction);
      return !ancestorPath.has(nextId);
    });
    return {
      graphId,
      depth: currentDepth,
      viaRef,
      children: [],
      truncated: hasHidden && edges.length > 0,
    };
  }

  const uniquePeers: { ref: GraphReference; nextId: string }[] = [];
  const seenPeers = new Set<string>();

  for (const ref of edges) {
    const nextId = peerGraphId(ref, direction);
    if (seenPeers.has(nextId)) continue;
    seenPeers.add(nextId);
    uniquePeers.push({ ref, nextId });
  }

  const limit = clampBreadth(breadthLimit);
  const truncatedByBreadth = uniquePeers.length > limit;
  const keptPeers = uniquePeers.slice(0, limit);

  const children: ReferenceTreeNode[] = [];

  for (const { ref, nextId } of keptPeers) {
    if (ancestorPath.has(nextId)) {
      children.push({
        graphId: nextId,
        depth: currentDepth + 1,
        viaRef: ref,
        children: [],
        cyclic: true,
      });
      continue;
    }

    const nextPath = new Set(ancestorPath);
    nextPath.add(graphId);

    children.push(
      buildSubtree(nextId, index, direction, maxDepth, currentDepth + 1, nextPath, limit, ref)
    );
  }

  return {
    graphId,
    depth: currentDepth,
    viaRef,
    children,
    truncated: truncatedByBreadth,
  };
}

export function buildReferenceTree(
  rootId: string,
  index: Map<string, GraphReferenceEdges>,
  direction: ReferenceTreeDirection,
  maxDepth: number,
  breadthLimit: number = REFERENCE_BREADTH_DEFAULT
): ReferenceTreeResult {
  const clampedDepth = Math.min(
    REFERENCE_DEPTH_MAX,
    Math.max(REFERENCE_DEPTH_MIN, maxDepth)
  );
  const clampedBreadth = clampBreadth(breadthLimit);
  const rootPath = new Set<string>([rootId]);

  if (direction === 'both') {
    return {
      rootId,
      direction,
      maxDepth: clampedDepth,
      tree: buildSubtree(rootId, index, 'dependencies', clampedDepth, 0, rootPath, clampedBreadth),
      referencersTree: buildSubtree(rootId, index, 'referencers', clampedDepth, 0, rootPath, clampedBreadth),
    };
  }

  const dir = direction === 'dependencies' ? 'dependencies' : 'referencers';
  return {
    rootId,
    direction,
    maxDepth: clampedDepth,
    tree: buildSubtree(rootId, index, dir, clampedDepth, 0, rootPath, clampedBreadth),
  };
}

export function countTreeNodes(node: ReferenceTreeNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countTreeNodes(c), 0);
}
