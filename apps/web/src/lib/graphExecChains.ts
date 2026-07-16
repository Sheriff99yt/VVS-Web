import type { VVSEdge, VVSNode } from '@/types/graph';

/** Forward + reverse adjacency over execution wires only. */
export interface ExecChainGraph {
  forward: Map<string, string[]>;
  reverse: Map<string, string[]>;
}

export interface ChainResolveResult {
  /** Node ids to select after the resolve. */
  nodeIds: Set<string>;
  /** Weakly connected exec components that contributed (for layout / future tools). */
  components: string[][];
}

export function isExecEdge(edge: VVSEdge): boolean {
  return edge.data?.pinType === 'execution';
}

/** Non-execution wire (condition, args, Get→Set, etc.). */
export function isDataEdge(edge: VVSEdge): boolean {
  return !isExecEdge(edge);
}

function pushAdj(map: Map<string, string[]>, from: string, to: string) {
  const list = map.get(from);
  if (list) {
    if (!list.includes(to)) list.push(to);
  } else {
    map.set(from, [to]);
  }
}

/** Build directed exec adjacency from edges (data wires ignored). */
export function buildExecAdjacency(edges: readonly VVSEdge[]): ExecChainGraph {
  const forward = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();
  for (const edge of edges) {
    if (!isExecEdge(edge)) continue;
    pushAdj(forward, edge.source, edge.target);
    pushAdj(reverse, edge.target, edge.source);
  }
  return { forward, reverse };
}

/** Data-flow adjacency: source produces a value consumed by target. */
export function buildDataAdjacency(edges: readonly VVSEdge[]): ExecChainGraph {
  const forward = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();
  for (const edge of edges) {
    if (!isDataEdge(edge)) continue;
    pushAdj(forward, edge.source, edge.target);
    pushAdj(reverse, edge.target, edge.source);
  }
  return { forward, reverse };
}

function neighborsUndirected(graph: ExecChainGraph, id: string): string[] {
  const out = graph.forward.get(id) ?? [];
  const inn = graph.reverse.get(id) ?? [];
  if (inn.length === 0) return out;
  if (out.length === 0) return inn;
  const seen = new Set(out);
  const merged = [...out];
  for (const n of inn) {
    if (!seen.has(n)) {
      seen.add(n);
      merged.push(n);
    }
  }
  return merged;
}

/**
 * Weakly connected exec component containing `nodeId`.
 * Isolated nodes (no exec wires) yield a singleton component.
 */
export function execComponentContaining(nodeId: string, graph: ExecChainGraph): string[] {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const n of neighborsUndirected(graph, id)) {
      if (!visited.has(n)) queue.push(n);
    }
  }
  return [...visited];
}

/**
 * Heads = nodes in the component with no inbound exec edge from another
 * node **in the same component**.
 */
export function execChainHeads(component: readonly string[], graph: ExecChainGraph): string[] {
  const inComponent = new Set(component);
  const heads: string[] = [];
  for (const id of component) {
    const preds = graph.reverse.get(id) ?? [];
    const hasIn = preds.some((p) => inComponent.has(p));
    if (!hasIn) heads.push(id);
  }
  // Cycle-only component: every node has an in-edge — fall back to all members.
  return heads.length > 0 ? heads : [...component];
}

/** Forward reachability from `seeds` (includes seeds). */
export function downstreamFrom(seeds: readonly string[], graph: ExecChainGraph): Set<string> {
  const out = new Set<string>();
  const queue = [...seeds];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const t of graph.forward.get(id) ?? []) {
      if (!out.has(t)) queue.push(t);
    }
  }
  return out;
}

function knownNodeIds(nodes: readonly VVSNode[]): Set<string> {
  return new Set(nodes.map((n) => n.id));
}

function filterToKnown(ids: Iterable<string>, known: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const id of ids) {
    if (known.has(id)) out.add(id);
  }
  return out;
}

/**
 * Pull in expression / attribute producers wired into `seeds` via data pins
 * (e.g. Compare → Branch.condition), recursively.
 */
export function collectDataInputClosure(
  seeds: ReadonlySet<string>,
  edges: readonly VVSEdge[],
  known: ReadonlySet<string>
): Set<string> {
  const data = buildDataAdjacency(edges);
  const out = new Set<string>();
  const queue = [...seeds];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const src of data.reverse.get(id) ?? []) {
      if (!known.has(src) || out.has(src) || seeds.has(src)) continue;
      out.add(src);
      queue.push(src);
    }
  }
  return out;
}

/** React Flow parented children of any seed (nested/group members). */
export function collectParentedChildren(
  seeds: ReadonlySet<string>,
  nodes: readonly VVSNode[]
): Set<string> {
  const out = new Set<string>();
  for (const n of nodes) {
    if (n.parentId && seeds.has(n.parentId)) out.add(n.id);
  }
  return out;
}

/**
 * After exec resolve: include data-input expression trees and parented children.
 * Iterates to a fixed point so nested attributes of newly added nodes are included.
 */
export function expandWithChainAttributes(
  nodeIds: ReadonlySet<string>,
  nodes: readonly VVSNode[],
  edges: readonly VVSEdge[]
): Set<string> {
  const known = knownNodeIds(nodes);
  const out = filterToKnown(nodeIds, known);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 64) {
    changed = false;
    const data = collectDataInputClosure(out, edges, known);
    const kids = collectParentedChildren(out, nodes);
    for (const id of data) {
      if (!out.has(id)) {
        out.add(id);
        changed = true;
      }
    }
    for (const id of kids) {
      if (!out.has(id) && known.has(id)) {
        out.add(id);
        changed = true;
      }
    }
  }
  return out;
}

function withAttributes(
  result: ChainResolveResult,
  nodes: readonly VVSNode[],
  edges: readonly VVSEdge[]
): ChainResolveResult {
  return {
    ...result,
    nodeIds: expandWithChainAttributes(result.nodeIds, nodes, edges),
  };
}

/**
 * **S** — select the current seeds plus everything forward-reachable on exec
 * wires (downstream only; does **not** walk upstream to chain heads), then
 * pull in data-wired attributes (e.g. If condition) and parented children.
 * Distinct from **A** (`expandToFullChains`), which also includes exec upstream.
 */
export function selectDownstreamFromSelection(
  selectedIds: ReadonlySet<string>,
  nodes: readonly VVSNode[],
  edges: readonly VVSEdge[]
): ChainResolveResult {
  const known = knownNodeIds(nodes);
  const seeds = filterToKnown(selectedIds, known);
  if (seeds.size === 0) {
    return { nodeIds: new Set(), components: [] };
  }

  const graph = buildExecAdjacency(edges);
  const nodeIds = filterToKnown(downstreamFrom([...seeds], graph), known);

  const components: string[][] = [];
  const seenMember = new Set<string>();
  for (const seed of seeds) {
    if (seenMember.has(seed)) continue;
    const component = execComponentContaining(seed, graph).filter((id) => known.has(id));
    for (const id of component) seenMember.add(id);
    components.push(component);
  }

  return withAttributes({ nodeIds, components }, nodes, edges);
}

/**
 * **A** — expand selection to full undirected exec chain(s) containing any
 * selected node (upstream + downstream), plus data attributes / children.
 */
export function expandToFullChains(
  selectedIds: ReadonlySet<string>,
  nodes: readonly VVSNode[],
  edges: readonly VVSEdge[]
): ChainResolveResult {
  const known = knownNodeIds(nodes);
  const seeds = filterToKnown(selectedIds, known);
  if (seeds.size === 0) {
    return { nodeIds: new Set(), components: [] };
  }

  const graph = buildExecAdjacency(edges);
  const nodeIds = new Set<string>();
  const components: string[][] = [];
  const seenMember = new Set<string>();

  for (const seed of seeds) {
    if (seenMember.has(seed)) continue;
    const component = execComponentContaining(seed, graph).filter((id) => known.has(id));
    for (const id of component) {
      seenMember.add(id);
      nodeIds.add(id);
    }
    components.push(component);
  }

  return withAttributes({ nodeIds, components }, nodes, edges);
}
