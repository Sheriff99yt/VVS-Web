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
 * Undirected shortest path on exec wires (inclusive endpoints).
 * Returns null if the nodes are not in the same weakly connected component.
 */
export function shortestUndirectedExecPath(
  fromId: string,
  toId: string,
  graph: ExecChainGraph
): string[] | null {
  if (fromId === toId) return [fromId];
  const prev = new Map<string, string | null>();
  prev.set(fromId, null);
  const queue = [fromId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const n of neighborsUndirected(graph, id)) {
      if (prev.has(n)) continue;
      prev.set(n, id);
      if (n === toId) {
        const path: string[] = [toId];
        let cur: string | null = toId;
        while (cur !== fromId) {
          cur = prev.get(cur!) ?? null;
          if (cur == null) return null;
          path.push(cur);
        }
        path.reverse();
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

/** Nodes that can reach `sink` via directed exec edges (includes `sink`). */
function ancestorsOf(sink: string, graph: ExecChainGraph): Set<string> {
  return downstreamFrom([sink], {
    forward: graph.reverse,
    reverse: graph.forward,
  });
}

/**
 * Every node that lies on **some** directed exec path from `fromId` to `toId`
 * (includes endpoints). Empty set if no directed path.
 */
export function nodesOnDirectedExecPaths(
  fromId: string,
  toId: string,
  graph: ExecChainGraph
): Set<string> {
  if (fromId === toId) return new Set([fromId]);
  const reachable = downstreamFrom([fromId], graph);
  if (!reachable.has(toId)) return new Set();
  const canReachTo = ancestorsOf(toId, graph);
  const out = new Set<string>();
  for (const id of reachable) {
    if (canReachTo.has(id)) out.add(id);
  }
  return out;
}

function isOnExecGraph(id: string, graph: ExecChainGraph): boolean {
  return graph.forward.has(id) || graph.reverse.has(id);
}

/**
 * Map a clicked node to exec-chain host(s): itself if on exec wires, else
 * follow data outputs / parentId until an exec participant is found.
 * Lets Shift+range start or end on attribute / parented children.
 */
export function resolveExecHostsForRange(
  nodeId: string,
  nodes: readonly VVSNode[],
  edges: readonly VVSEdge[],
  graph: ExecChainGraph
): string[] {
  const known = knownNodeIds(nodes);
  if (!known.has(nodeId)) return [];
  if (isOnExecGraph(nodeId, graph)) return [nodeId];

  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const data = buildDataAdjacency(edges);
  const hosts = new Set<string>();
  const queue = [nodeId];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);

    if (isOnExecGraph(id, graph)) {
      hosts.add(id);
      continue;
    }

    for (const t of data.forward.get(id) ?? []) {
      if (known.has(t) && !seen.has(t)) queue.push(t);
    }

    const parentId = byId.get(id)?.parentId;
    if (parentId && known.has(parentId) && !seen.has(parentId)) {
      queue.push(parentId);
    }
  }

  return [...hosts];
}

function rangeBetweenExecHosts(
  fromHost: string,
  toHost: string,
  graph: ExecChainGraph
): Set<string> {
  let nodeIds = nodesOnDirectedExecPaths(fromHost, toHost, graph);
  if (nodeIds.size === 0) {
    nodeIds = nodesOnDirectedExecPaths(toHost, fromHost, graph);
  }
  if (nodeIds.size === 0) {
    const path = shortestUndirectedExecPath(fromHost, toHost, graph);
    if (path) nodeIds = new Set(path);
  }
  return nodeIds;
}

/**
 * Shift+click range on an exec chain: select everything between two nodes.
 * Endpoints may be exec nodes **or** data/parented children — those resolve to
 * their exec hosts first. Prefers all nodes on directed paths; otherwise the
 * undirected shortest path. Pulls in data attributes / parented children.
 */
export function selectExecRangeBetween(
  fromId: string,
  toId: string,
  nodes: readonly VVSNode[],
  edges: readonly VVSEdge[]
): ChainResolveResult {
  const known = knownNodeIds(nodes);
  if (!known.has(fromId) || !known.has(toId)) {
    return { nodeIds: new Set(), components: [] };
  }

  const graph = buildExecAdjacency(edges);
  const fromHosts = resolveExecHostsForRange(fromId, nodes, edges, graph);
  const toHosts = resolveExecHostsForRange(toId, nodes, edges, graph);
  if (fromHosts.length === 0 || toHosts.length === 0) {
    return { nodeIds: new Set(), components: [] };
  }

  let best: Set<string> | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const a of fromHosts) {
    for (const b of toHosts) {
      const ids = rangeBetweenExecHosts(a, b, graph);
      if (ids.size === 0) continue;
      if (ids.size < bestScore) {
        bestScore = ids.size;
        best = ids;
      }
    }
  }

  if (!best) {
    return { nodeIds: new Set(), components: [] };
  }

  // Keep the clicked child endpoints even if they are attributes of the hosts.
  best.add(fromId);
  best.add(toId);

  const nodeIds = filterToKnown(best, known);
  const component = execComponentContaining(fromHosts[0]!, graph).filter((id) =>
    known.has(id)
  );
  return withAttributes({ nodeIds, components: [component] }, nodes, edges);
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
