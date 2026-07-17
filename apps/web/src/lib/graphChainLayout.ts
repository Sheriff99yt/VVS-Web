import type { VVSEdge, VVSNode } from '@/types/graph';
import {
  absolutePosition,
  isCommentNode,
  resizeCommentToFitMembers,
} from './graphCommentMembership';
import {
  buildDataAdjacency,
  buildExecAdjacency,
  execChainHeads,
  execComponentContaining,
  type ExecChainGraph,
} from './graphExecChains';

/**
 * After an S that expands (or re-affirms) downstream selection, a second S within
 * this window runs layout. Long enough for S → glance → S, not only a rapid double-tap.
 */
export const CHAIN_LAYOUT_SECOND_S_MS = 2000;
/** Duration for animated S S layout moves when the preference is on. */
export const CHAIN_LAYOUT_ANIM_MS = 280;

export type ChainAttributeDirection = 'above' | 'below' | 'below-extended';

export type ChainLayoutStrategyId = 'lane-topo-v1';

export interface ChainLayoutInput {
  nodes: readonly VVSNode[];
  edges: readonly VVSEdge[];
  selectedIds: ReadonlySet<string>;
  /** Where data-attribute trees hang relative to their consumer. Default `above`. */
  attributeDirection?: ChainAttributeDirection;
}

export type ChainLayoutPositions = Map<string, { x: number; y: number }>;

export interface ChainLayoutStrategy {
  id: ChainLayoutStrategyId;
  layout: (input: ChainLayoutInput) => ChainLayoutPositions;
}

export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export type StepAnimateChainLayoutSpeed = 'slow' | 'normal' | 'fast';

/** Map UI speed preset → per-column duration and stagger. */
export function stepAnimateTiming(speed: StepAnimateChainLayoutSpeed): {
  stepDurationMs: number;
  staggerMs: number;
} {
  switch (speed) {
    case 'slow':
      return { stepDurationMs: 560, staggerMs: 110 };
    case 'fast':
      return { stepDurationMs: 160, staggerMs: 24 };
    default:
      // Former "slow" — now the default cadence.
      return { stepDurationMs: 420, staggerMs: 80 };
  }
}

/** Absolute positions for the given node ids (for layout animation start frames). */
export function captureAbsolutePositions(
  nodes: readonly VVSNode[],
  ids: Iterable<string>
): ChainLayoutPositions {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: ChainLayoutPositions = new Map();
  for (const id of ids) {
    const n = byId.get(id);
    if (n) out.set(id, absolutePosition(n, byId));
  }
  return out;
}

/** Linear interpolate absolute layout targets (keys from `to`). */
export function lerpChainLayoutPositions(
  from: ChainLayoutPositions,
  to: ChainLayoutPositions,
  t: number
): ChainLayoutPositions {
  const out: ChainLayoutPositions = new Map();
  for (const [id, target] of to) {
    const start = from.get(id) ?? target;
    out.set(id, {
      x: start.x + (target.x - start.x) * t,
      y: start.y + (target.y - start.y) * t,
    });
  }
  return out;
}

const COLUMN_BUCKET_EPS = 24;

/**
 * Group target positions into left→right columns for staggered step animation.
 * Nodes in the same column move together; columns start in sequence.
 */
export function orderLayoutStepsByColumn(to: ChainLayoutPositions): string[][] {
  const entries = [...to.entries()].sort(
    (a, b) => a[1].x - b[1].x || a[1].y - b[1].y || a[0].localeCompare(b[0])
  );
  const columns: string[][] = [];
  for (const [id, pos] of entries) {
    const last = columns[columns.length - 1];
    if (!last) {
      columns.push([id]);
      continue;
    }
    const lastX = to.get(last[0]!)!.x;
    if (Math.abs(pos.x - lastX) <= COLUMN_BUCKET_EPS) last.push(id);
    else columns.push([id]);
  }
  return columns;
}

/**
 * Staggered column lerp. `elapsedMs` is time since animation start.
 * Columns that have not started yet stay at `from`.
 */
export function lerpChainLayoutPositionsStepped(
  from: ChainLayoutPositions,
  to: ChainLayoutPositions,
  steps: readonly string[][],
  elapsedMs: number,
  stepDurationMs: number,
  staggerMs: number
): { positions: ChainLayoutPositions; done: boolean } {
  const out: ChainLayoutPositions = new Map();
  let done = true;
  for (let si = 0; si < steps.length; si++) {
    const local = Math.min(1, Math.max(0, (elapsedMs - si * staggerMs) / stepDurationMs));
    if (local < 1) done = false;
    const eased = easeOutCubic(local);
    for (const id of steps[si]!) {
      const target = to.get(id);
      if (!target) continue;
      const start = from.get(id) ?? target;
      out.set(id, {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
      });
    }
  }
  // Include any targets missing from steps (shouldn't happen) at full blend.
  for (const [id, target] of to) {
    if (!out.has(id)) out.set(id, target);
  }
  return { positions: out, done };
}

const DEFAULT_NODE_W = 180;
const DEFAULT_NODE_H = 80;
const COLUMN_GAP = 60;
const ROW_GAP = 40;
/** Slight left bias so attribute pins face the consumer without entering the previous spine column. */
const ATTR_LEFT_NUDGE = 28;
/** Horizontal edge gap between consecutive stair nodes (tight, like Blueprint expr chains). */
const STAIR_H_GAP = 36;
/** Small vertical rise per hop toward the consumer. */
const STAIR_V_STEP = 32;
const STAIR_BASE_GAP = 44;
const STAIR_SIBLING_Y = 16;
/** Padding added to child-stair width when reserving spine buffer before the consumer. */
const STAIR_SPINE_PAD = 24;
/** Vertical gap between multi-chain groups after the final separation pass. */
const CHAIN_SEPARATION_GAP = 48;

type AttrTree = {
  attrs: Set<string>;
  depths: Map<string, number>;
};

/** Data-input subtree feeding `consumerId` (selected only; excludes already-placed spine). */
function collectAttrTree(
  consumerId: string,
  selectedIds: ReadonlySet<string>,
  data: ExecChainGraph,
  placedSpine: ReadonlySet<string>
): AttrTree {
  const attrs = new Set<string>();
  const queue = [...(data.reverse.get(consumerId) ?? [])].filter((id) =>
    selectedIds.has(id)
  );
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === consumerId || !selectedIds.has(id) || placedSpine.has(id)) continue;
    if (attrs.has(id)) continue;
    attrs.add(id);
    for (const src of data.reverse.get(id) ?? []) {
      if (selectedIds.has(src) && !attrs.has(src) && !placedSpine.has(src)) {
        queue.push(src);
      }
    }
  }

  const depths = new Map<string, number>([[consumerId, 0]]);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 64) {
    changed = false;
    for (const id of attrs) {
      for (const tgt of data.forward.get(id) ?? []) {
        if (tgt !== consumerId && !attrs.has(tgt)) continue;
        const td = depths.get(tgt);
        if (td === undefined) continue;
        const nd = td + 1;
        const prev = depths.get(id) ?? 0;
        if (nd > prev) {
          depths.set(id, nd);
          changed = true;
        }
      }
    }
  }

  return { attrs, depths };
}

/**
 * Horizontal footprint of the below-extended stair: sum of per-depth column
 * widths + gaps — reserved as buffer on the exec wire before the consumer.
 */
function estimateAttrStairWidth(tree: AttrTree, byId: Map<string, VVSNode>): number {
  const { attrs, depths } = tree;
  if (attrs.size === 0) return 0;

  const byDepth = new Map<number, string[]>();
  let maxDepth = 0;
  for (const id of attrs) {
    const d = depths.get(id) ?? 1;
    maxDepth = Math.max(maxDepth, d);
    const list = byDepth.get(d);
    if (list) list.push(id);
    else byDepth.set(d, [id]);
  }

  let total = ATTR_LEFT_NUDGE;
  for (let d = 1; d <= maxDepth; d++) {
    const ids = byDepth.get(d) ?? [];
    let colW = 0;
    ids.forEach((id, i) => {
      const n = byId.get(id);
      const w = n ? nodeSize(n).w : DEFAULT_NODE_W;
      colW += w;
      if (i > 0) colW += Math.round(w * 0.15);
    });
    if (ids.length === 0) colW = DEFAULT_NODE_W;
    total += colW;
    if (d < maxDepth) total += STAIR_H_GAP;
  }
  return total + STAIR_SPINE_PAD;
}

function nodeSize(node: VVSNode): { w: number; h: number } {
  return {
    w: node.measured?.width ?? node.width ?? DEFAULT_NODE_W,
    h: node.measured?.height ?? node.height ?? DEFAULT_NODE_H,
  };
}

function partitionSelectedComponents(
  selectedIds: ReadonlySet<string>,
  graph: ExecChainGraph
): string[][] {
  const components: string[][] = [];
  const seen = new Set<string>();
  for (const id of selectedIds) {
    if (seen.has(id)) continue;
    const full = execComponentContaining(id, graph);
    const component = full.filter((n) => selectedIds.has(n));
    for (const n of component) seen.add(n);
    if (component.length > 0) components.push(component);
  }
  return components;
}

/** Restrict adjacency to edges whose both ends are in `allowed`. */
function subgraphAdj(graph: ExecChainGraph, allowed: ReadonlySet<string>): ExecChainGraph {
  const forward = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();
  for (const [src, targets] of graph.forward) {
    if (!allowed.has(src)) continue;
    const next = targets.filter((t) => allowed.has(t));
    if (next.length > 0) forward.set(src, next);
  }
  for (const [tgt, sources] of graph.reverse) {
    if (!allowed.has(tgt)) continue;
    const prev = sources.filter((s) => allowed.has(s));
    if (prev.length > 0) reverse.set(tgt, prev);
  }
  return { forward, reverse };
}

function assignLayers(component: readonly string[], graph: ExecChainGraph): Map<string, number> {
  const allowed = new Set(component);
  const heads = execChainHeads(component, graph);
  const layers = new Map<string, number>();
  for (const h of heads) layers.set(h, 0);

  const queue = [...heads];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const base = layers.get(id) ?? 0;
    for (const t of graph.forward.get(id) ?? []) {
      if (!allowed.has(t)) continue;
      const next = base + 1;
      const prev = layers.get(t);
      if (prev === undefined || next > prev) {
        layers.set(t, next);
        queue.push(t);
      }
    }
  }

  for (const id of component) {
    if (!layers.has(id)) layers.set(id, 0);
  }
  return layers;
}

function sortLane(
  ids: string[],
  byId: Map<string, VVSNode>,
  graph: ExecChainGraph
): string[] {
  return [...ids].sort((a, b) => {
    const ya = byId.get(a)?.position.y ?? 0;
    const yb = byId.get(b)?.position.y ?? 0;
    if (ya !== yb) return ya - yb;
    const predsA = graph.reverse.get(a) ?? [];
    const predsB = graph.reverse.get(b) ?? [];
    return a.localeCompare(b) || predsA.length - predsB.length;
  });
}

function layoutComponentLaneTopo(
  component: readonly string[],
  byId: Map<string, VVSNode>,
  fullGraph: ExecChainGraph,
  out: ChainLayoutPositions,
  defaultColumnGap: number = COLUMN_GAP,
  /** Extra horizontal buffer reserved *before* a spine node (e.g. child stair width). */
  gapBeforeNode?: ReadonlyMap<string, number>
) {
  const allowed = new Set(component);
  const graph = subgraphAdj(fullGraph, allowed);
  const layers = assignLayers(component, graph);

  const byLayer = new Map<number, string[]>();
  let maxLayer = 0;
  for (const id of component) {
    const layer = layers.get(id) ?? 0;
    maxLayer = Math.max(maxLayer, layer);
    const list = byLayer.get(layer);
    if (list) list.push(id);
    else byLayer.set(layer, [id]);
  }

  const colWidths: number[] = [];
  for (let layer = 0; layer <= maxLayer; layer++) {
    const ids = byLayer.get(layer) ?? [];
    let maxW = DEFAULT_NODE_W;
    for (const id of ids) {
      const n = byId.get(id);
      if (n) maxW = Math.max(maxW, nodeSize(n).w);
    }
    colWidths[layer] = maxW;
  }

  const colX: number[] = [];
  let x = 0;
  for (let layer = 0; layer <= maxLayer; layer++) {
    colX[layer] = x;
    let gap = defaultColumnGap;
    if (layer < maxLayer) {
      for (const id of byLayer.get(layer + 1) ?? []) {
        const reserved = gapBeforeNode?.get(id);
        if (reserved != null) gap = Math.max(gap, reserved);
      }
    }
    x += colWidths[layer] + gap;
  }

  const local = new Map<string, { x: number; y: number }>();
  for (let layer = 0; layer <= maxLayer; layer++) {
    const ids = sortLane(byLayer.get(layer) ?? [], byId, graph);
    let y = 0;
    for (const id of ids) {
      local.set(id, { x: colX[layer], y });
      const n = byId.get(id);
      y += (n ? nodeSize(n).h : DEFAULT_NODE_H) + ROW_GAP;
    }
  }

  // Anchor: keep the chain's first node (exec head) fixed so the rest
  // straighten relative to it instead of the whole group jumping.
  const anchorId = pickChainAnchor(component, graph, byId);
  const anchorNode = byId.get(anchorId);
  const localAnchor = local.get(anchorId) ?? { x: 0, y: 0 };
  const dx = (anchorNode?.position.x ?? 0) - localAnchor.x;
  const dy = (anchorNode?.position.y ?? 0) - localAnchor.y;

  for (const [id, pos] of local) {
    out.set(id, { x: pos.x + dx, y: pos.y + dy });
  }
}

/** Prefer exec head(s); if several, the leftmost/topmost in the current layout. */
function pickChainAnchor(
  component: readonly string[],
  graph: ExecChainGraph,
  byId: Map<string, VVSNode>
): string {
  const heads = execChainHeads(component, graph);
  const candidates = heads.length > 0 ? heads : [...component];
  return [...candidates].sort((a, b) => {
    const pa = byId.get(a)?.position ?? { x: 0, y: 0 };
    const pb = byId.get(b)?.position ?? { x: 0, y: 0 };
    if (pa.x !== pb.x) return pa.x - pb.x;
    if (pa.y !== pb.y) return pa.y - pb.y;
    return a.localeCompare(b);
  })[0]!;
}

/**
 * Place data-input / attribute trees beside each consumer without crossing the
 * long L→R exec spine.
 *
 * - `above` (default): canopy stacks upward in the consumer's column strip.
 * - `below`: hang under the consumer as a vertical stack.
 * - `below-extended`: low horizontal staircase under the spine (spread left,
 *   slight rise toward the consumer — less vertical space).
 */
function placeDataInputTrees(
  selectedIds: ReadonlySet<string>,
  byId: Map<string, VVSNode>,
  edges: readonly VVSEdge[],
  positions: ChainLayoutPositions,
  direction: ChainAttributeDirection,
  spineIds: ReadonlySet<string> = selectedIds
) {
  if (direction === 'below-extended') {
    placeBelowExtendedStair(selectedIds, byId, edges, positions, spineIds);
    return;
  }

  const data = buildDataAdjacency(edges);
  /** For above: top (min y) claimed; for below: next free y below the strip. */
  const stripCursor = new Map<string, number>();

  let guard = 0;
  while (guard++ < 64) {
    const byConsumer = new Map<string, string[]>();
    for (const id of selectedIds) {
      if (positions.has(id)) continue;
      const targets = (data.forward.get(id) ?? []).filter(
        (t) => selectedIds.has(t) && positions.has(t)
      );
      if (targets.length === 0) continue;
      let primary = targets[0]!;
      let bestScore = attributeParentScore(primary, positions, stripCursor, direction, byId);
      for (const t of targets) {
        const score = attributeParentScore(t, positions, stripCursor, direction, byId);
        if (score < bestScore) {
          bestScore = score;
          primary = t;
        }
      }
      const list = byConsumer.get(primary);
      if (list) {
        if (!list.includes(id)) list.push(id);
      } else {
        byConsumer.set(primary, [id]);
      }
    }
    if (byConsumer.size === 0) break;

    for (const [consumerId, sources] of byConsumer) {
      const cPos = positions.get(consumerId)!;
      const consumer = byId.get(consumerId);
      const consumerW = consumer ? nodeSize(consumer).w : DEFAULT_NODE_W;
      const consumerH = consumer ? nodeSize(consumer).h : DEFAULT_NODE_H;

      const sorted = [...sources].sort((a, b) => {
        const ya = byId.get(a)?.position.y ?? 0;
        const yb = byId.get(b)?.position.y ?? 0;
        if (ya !== yb) return ya - yb;
        return a.localeCompare(b);
      });

      let maxW = DEFAULT_NODE_W;
      for (const sid of sorted) {
        const n = byId.get(sid);
        if (n) maxW = Math.max(maxW, nodeSize(n).w);
      }

      const colX = cPos.x + (consumerW - maxW) / 2 - ATTR_LEFT_NUDGE;

      if (direction === 'above') {
        let top = stripCursor.get(consumerId);
        if (top === undefined) top = cPos.y - ROW_GAP;
        for (const sid of sorted) {
          if (positions.has(sid)) continue;
          const n = byId.get(sid);
          const h = n ? nodeSize(n).h : DEFAULT_NODE_H;
          top -= h;
          positions.set(sid, { x: colX, y: top });
          top -= ROW_GAP;
        }
        stripCursor.set(consumerId, top);
      } else {
        let y = stripCursor.get(consumerId);
        if (y === undefined) y = cPos.y + consumerH + ROW_GAP;
        for (const sid of sorted) {
          if (positions.has(sid)) continue;
          const n = byId.get(sid);
          const h = n ? nodeSize(n).h : DEFAULT_NODE_H;
          positions.set(sid, { x: colX, y });
          y += h + ROW_GAP;
        }
        stripCursor.set(consumerId, y);
      }
    }
  }
}

/**
 * Flat staircase under the consumer: each expression node is placed a short
 * edge-gap left of the node it feeds, inside the horizontal buffer reserved
 * on the exec spine (sum of child widths).
 */
function placeBelowExtendedStair(
  selectedIds: ReadonlySet<string>,
  byId: Map<string, VVSNode>,
  edges: readonly VVSEdge[],
  positions: ChainLayoutPositions,
  spineIds: ReadonlySet<string>
) {
  const data = buildDataAdjacency(edges);

  const consumers: string[] = [];
  for (const id of selectedIds) {
    if (!positions.has(id) || !spineIds.has(id)) continue;
    const hasPendingInput = (data.reverse.get(id) ?? []).some(
      (src) => selectedIds.has(src) && !positions.has(src)
    );
    if (hasPendingInput) consumers.push(id);
  }
  consumers.sort((a, b) => positions.get(a)!.x - positions.get(b)!.x);

  for (const consumerId of consumers) {
    const { attrs, depths } = collectAttrTree(consumerId, selectedIds, data, spineIds);
    if (attrs.size === 0) continue;

    const consumer = byId.get(consumerId);
    const consumerH = consumer ? nodeSize(consumer).h : DEFAULT_NODE_H;

    const byDepth = new Map<number, string[]>();
    for (const id of attrs) {
      const d = depths.get(id) ?? 1;
      const list = byDepth.get(d);
      if (list) list.push(id);
      else byDepth.set(d, [id]);
    }

    for (const [depth, ids] of [...byDepth.entries()].sort((a, b) => a[0] - b[0])) {
      const sorted = [...ids].sort((a, b) => {
        const ya = byId.get(a)?.position.y ?? 0;
        const yb = byId.get(b)?.position.y ?? 0;
        if (ya !== yb) return ya - yb;
        return a.localeCompare(b);
      });

      sorted.forEach((sid, i) => {
        if (positions.has(sid)) return;
        const n = byId.get(sid);
        const { w } = n ? nodeSize(n) : { w: DEFAULT_NODE_W };

        const targets = (data.forward.get(sid) ?? []).filter(
          (t) => (t === consumerId || attrs.has(t)) && positions.has(t)
        );
        let anchorId = consumerId;
        let bestDepth = Number.POSITIVE_INFINITY;
        let bestX = Number.POSITIVE_INFINITY;
        for (const t of targets) {
          const td = t === consumerId ? 0 : (depths.get(t) ?? 999);
          const tx = positions.get(t)!.x;
          if (td < bestDepth || (td === bestDepth && tx < bestX)) {
            bestDepth = td;
            bestX = tx;
            anchorId = t;
          }
        }

        const anchor = positions.get(anchorId)!;

        let x: number;
        let y: number;
        if (anchorId === consumerId) {
          x = anchor.x - ATTR_LEFT_NUDGE - w - i * Math.round(w * 0.15);
          y = anchor.y + consumerH + STAIR_BASE_GAP + i * STAIR_SIBLING_Y;
        } else {
          x = anchor.x - STAIR_H_GAP - w;
          y = anchor.y + STAIR_V_STEP + i * STAIR_SIBLING_Y;
        }

        positions.set(sid, { x, y });
      });
    }
  }
}

/** Lower score = prefer as expression parent. */
function attributeParentScore(
  id: string,
  positions: ChainLayoutPositions,
  stripCursor: Map<string, number>,
  direction: ChainAttributeDirection,
  byId: Map<string, VVSNode>
): number {
  const pos = positions.get(id)!;
  if (direction === 'above') {
    const top = stripCursor.get(id) ?? pos.y;
    return top * 1000 + pos.y + pos.x * 0.001;
  }
  const node = byId.get(id);
  const h = node ? nodeSize(node).h : DEFAULT_NODE_H;
  const bottom = stripCursor.get(id) ?? pos.y + h;
  return -bottom * 1000 - pos.y + pos.x * 0.001;
}

function hasSelectedDataLink(
  id: string,
  selectedIds: ReadonlySet<string>,
  data: ExecChainGraph
): boolean {
  for (const t of data.forward.get(id) ?? []) {
    if (selectedIds.has(t)) return true;
  }
  for (const s of data.reverse.get(id) ?? []) {
    if (selectedIds.has(s)) return true;
  }
  return false;
}

/** Layout always works in absolute canvas space (comment children store relative coords). */
function withAbsolutePositionsForLayout(nodes: readonly VVSNode[]): VVSNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nodes.map((n) => ({
    ...n,
    position: absolutePosition(n, byId),
  }));
}

/**
 * Apply absolute layout positions back onto nodes. Parented (locked-comment)
 * members are converted to parent-relative coords; owning comments are resized
 * to fit afterward.
 */
export function applyLayoutPositionsToNodes(
  nodes: VVSNode[],
  positions: ChainLayoutPositions,
  selectedIds: ReadonlySet<string>
): VVSNode[] {
  if (positions.size === 0 && selectedIds.size === 0) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const absById = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    absById.set(
      n.id,
      positions.has(n.id) ? positions.get(n.id)! : absolutePosition(n, byId)
    );
  }

  const commentsToFit = new Set<string>();
  let next = nodes.map((n) => {
    const selected = selectedIds.has(n.id);
    const abs = positions.get(n.id);
    if (!abs) {
      return n.selected === selected ? n : { ...n, selected };
    }
    if (n.parentId && isCommentNode(byId.get(n.parentId))) {
      commentsToFit.add(n.parentId);
    }
    let position = abs;
    if (n.parentId) {
      const parentAbs = absById.get(n.parentId) ?? { x: 0, y: 0 };
      position = { x: abs.x - parentAbs.x, y: abs.y - parentAbs.y };
    }
    return { ...n, position, selected };
  });

  for (const commentId of commentsToFit) {
    next = resizeCommentToFitMembers(next, commentId);
  }
  return next;
}

/** Default strategy: topo columns left→right, parallel outs as vertical lanes. */
export function layoutLaneTopoV1(input: ChainLayoutInput): ChainLayoutPositions {
  const { nodes, edges, selectedIds, attributeDirection = 'below-extended' } = input;
  const out: ChainLayoutPositions = new Map();
  if (selectedIds.size === 0) return out;

  // Comment-locked members use relative positions — lift to absolute for layout math.
  const absNodes = withAbsolutePositionsForLayout(nodes);
  const byId = new Map(absNodes.map((n) => [n.id, n]));
  const knownSelected = new Set([...selectedIds].filter((id) => byId.has(id)));
  if (knownSelected.size === 0) return out;

  const fullGraph = buildExecAdjacency(edges);
  const dataGraph = buildDataAdjacency(edges);

  // Exec-participating selected nodes form the spine; data attributes use the canopy.
  const execSpine = new Set<string>();
  for (const id of knownSelected) {
    if (fullGraph.forward.has(id) || fullGraph.reverse.has(id)) {
      execSpine.add(id);
    } else if (!hasSelectedDataLink(id, knownSelected, dataGraph)) {
      execSpine.add(id);
    }
  }

  const components = partitionSelectedComponents(execSpine, fullGraph);

  // Below-extended: reserve horizontal buffer before each consumer equal to the
  // sum of its expression-child widths (so pulse———[children]———Print).
  const gapBeforeNode = new Map<string, number>();
  if (attributeDirection === 'below-extended') {
    for (const id of execSpine) {
      const tree = collectAttrTree(id, knownSelected, dataGraph, execSpine);
      const width = estimateAttrStairWidth(tree, byId);
      if (width > 0) gapBeforeNode.set(id, Math.max(COLUMN_GAP, width));
    }
  }

  for (const component of components) {
    layoutComponentLaneTopo(
      component,
      byId,
      fullGraph,
      out,
      COLUMN_GAP,
      attributeDirection === 'below-extended' ? gapBeforeNode : undefined
    );
  }

  placeDataInputTrees(
    knownSelected,
    byId,
    edges,
    out,
    attributeDirection,
    execSpine
  );

  // Final pass: when multiple chains were laid out, shift whole groups on Y
  // so their AABBs no longer collide (heads may move together with their chain).
  separateClustersVertically(knownSelected, byId, edges, out);
  return out;
}

type ClusterBox = {
  ids: string[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/** Undirected clusters over exec + data wires among selected, laid-out nodes. */
function partitionLayoutClusters(
  selectedIds: ReadonlySet<string>,
  edges: readonly VVSEdge[],
  positions: ChainLayoutPositions
): string[][] {
  const placed = [...selectedIds].filter((id) => positions.has(id));
  if (placed.length === 0) return [];

  const adj = new Map<string, string[]>();
  for (const id of placed) adj.set(id, []);

  const link = (a: string, b: string) => {
    if (!adj.has(a) || !adj.has(b) || a === b) return;
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };

  for (const edge of edges) {
    if (!positions.has(edge.source) || !positions.has(edge.target)) continue;
    if (!selectedIds.has(edge.source) || !selectedIds.has(edge.target)) continue;
    link(edge.source, edge.target);
  }

  const clusters: string[][] = [];
  const seen = new Set<string>();
  for (const start of placed) {
    if (seen.has(start)) continue;
    const cluster: string[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      cluster.push(id);
      for (const n of adj.get(id) ?? []) {
        if (!seen.has(n)) queue.push(n);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function clusterBoundingBox(
  ids: readonly string[],
  byId: Map<string, VVSNode>,
  positions: ChainLayoutPositions
): ClusterBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const present: string[] = [];
  for (const id of ids) {
    const pos = positions.get(id);
    const node = byId.get(id);
    if (!pos || !node) continue;
    present.push(id);
    const { w, h } = nodeSize(node);
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + w);
    maxY = Math.max(maxY, pos.y + h);
  }
  if (present.length === 0) return null;
  return { ids: present, minX, minY, maxX, maxY };
}

function boxesOverlap(a: ClusterBox, b: ClusterBox, gap: number): boolean {
  return !(
    a.maxX + gap <= b.minX ||
    b.maxX + gap <= a.minX ||
    a.maxY + gap <= b.minY ||
    b.maxY + gap <= a.minY
  );
}

/**
 * Rigidly translate chain clusters on Y so AABBs no longer intersect.
 * Topmost cluster stays; others are pushed down as needed (then a second
 * pass resolves any remaining overlaps by minimal vertical shifts).
 */
function separateClustersVertically(
  selectedIds: ReadonlySet<string>,
  byId: Map<string, VVSNode>,
  edges: readonly VVSEdge[],
  positions: ChainLayoutPositions
) {
  const clusters = partitionLayoutClusters(selectedIds, edges, positions);
  if (clusters.length < 2) return;

  const boxes: ClusterBox[] = [];
  for (const ids of clusters) {
    const box = clusterBoundingBox(ids, byId, positions);
    if (box) boxes.push(box);
  }
  if (boxes.length < 2) return;

  // Pack top → bottom: keep topmost group's Y, push others down past prior.
  boxes.sort((a, b) => a.minY - b.minY || a.minX - b.minX);

  let cursorMaxY = -Infinity;
  for (const box of boxes) {
    let dy = 0;
    if (cursorMaxY > -Infinity && box.minY < cursorMaxY + CHAIN_SEPARATION_GAP) {
      dy = cursorMaxY + CHAIN_SEPARATION_GAP - box.minY;
    }
    if (dy !== 0) {
      for (const id of box.ids) {
        const pos = positions.get(id)!;
        positions.set(id, { x: pos.x, y: pos.y + dy });
      }
      box.minY += dy;
      box.maxY += dy;
    }
    cursorMaxY = Math.max(cursorMaxY, box.maxY);
  }

  // Safety: if any pair still overlaps (wide horizontal neighbors with uneven
  // heights), push the lower one further down.
  let guard = 0;
  while (guard++ < 32) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        if (!boxesOverlap(a, b, CHAIN_SEPARATION_GAP)) continue;
        // Push the one that currently sits lower (or equal → later index).
        const lower = a.minY <= b.minY ? b : a;
        const upper = lower === a ? b : a;
        const dy = upper.maxY + CHAIN_SEPARATION_GAP - lower.minY;
        if (dy <= 0) continue;
        for (const id of lower.ids) {
          const pos = positions.get(id)!;
          positions.set(id, { x: pos.x, y: pos.y + dy });
        }
        lower.minY += dy;
        lower.maxY += dy;
        moved = true;
      }
    }
    if (!moved) break;
  }
}

export const CHAIN_LAYOUT_STRATEGIES: Record<ChainLayoutStrategyId, ChainLayoutStrategy> = {
  'lane-topo-v1': { id: 'lane-topo-v1', layout: layoutLaneTopoV1 },
};

/**
 * Layout selected exec-chain nodes. Returns new positions only for nodes that move.
 * Default strategy: `lane-topo-v1`.
 */
export function layoutSelectedExecChains(
  input: ChainLayoutInput,
  strategyId: ChainLayoutStrategyId = 'lane-topo-v1'
): ChainLayoutPositions {
  const strategy = CHAIN_LAYOUT_STRATEGIES[strategyId];
  return strategy.layout(input);
}
