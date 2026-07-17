/**
 * Canvas virtualization (U83) — conventions for large-graph React Flow.
 *
 * `@xyflow/react` `onlyRenderVisibleElements` unmounts off-viewport node/edge DOM.
 * Full `nodes`/`edges` arrays still live in `GraphWorkspaceHost` / `useGraphState`
 * (selection, MiniMap, search, history). Do not manually cull those arrays.
 *
 * Companion wins:
 * - `isPinWired` / `NodePinRow` — boolean store select (not the full edges array)
 * - `nodesForSearchSubscription` — search subscribes to nodes only while expanded
 * - Edit + reference canvases both pass `GRAPH_ONLY_RENDER_VISIBLE`
 */

/** Prefer keeping this on every interactive React Flow instance. */
export const GRAPH_ONLY_RENDER_VISIBLE = true as const;

/** Soft target from project requirements — stress graphs should meet this scale. */
export const GRAPH_VIRTUALIZATION_NODE_TARGET = 500;

/** Canvases that must pass `onlyRenderVisibleElements={GRAPH_ONLY_RENDER_VISIBLE}`. */
export const GRAPH_VIRTUALIZATION_CANVAS_SOURCES = [
  'components/graph/GraphCanvas.tsx',
  'components/views/ReferenceGraphCanvas.tsx',
] as const;

/** Minimal edge shape for pin wired-state checks (avoids coupling to xyflow Edge generics). */
export interface PinWireEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * Whether a pin is connected. Pure — used by `NodePinRow` store selectors so
 * pin rows only re-render when *this* pin's wired boolean flips.
 */
export function isPinWired(
  edges: readonly PinWireEdge[],
  nodeId: string,
  pinId: string,
  direction: 'input' | 'output'
): boolean {
  if (!nodeId || !pinId) return false;
  for (const edge of edges) {
    if (direction === 'input') {
      if (edge.target === nodeId && edge.targetHandle === pinId) return true;
    } else if (edge.source === nodeId && edge.sourceHandle === pinId) {
      return true;
    }
  }
  return false;
}

/** Stable empty list for collapsed search — same reference every time. */
export const EMPTY_SEARCH_NODES: readonly never[] = Object.freeze([]);

/**
 * Gate React Flow `useStore` / `useNodes` subscriptions for the canvas node search.
 * Collapsed search must not re-render on every node drag.
 */
export function nodesForSearchSubscription<T>(
  expanded: boolean,
  nodes: readonly T[]
): readonly T[] {
  return expanded ? nodes : (EMPTY_SEARCH_NODES as readonly T[]);
}

/**
 * How many node shells a viewport-culled canvas might still mount.
 * Full graph stays in app state; only DOM is culled — this is a soft estimate
 * for docs/tests (visible + small overscan), not an xyflow guarantee.
 */
export function estimateMountedNodeBudget(
  totalNodes: number,
  visibleNodes: number,
  overscan = 8
): number {
  if (totalNodes <= 0) return 0;
  if (visibleNodes < 0) return 0;
  const cappedVisible = Math.min(totalNodes, visibleNodes);
  return Math.min(totalNodes, cappedVisible + Math.max(0, overscan));
}

/** True when culling should materially reduce DOM vs mounting every node. */
export function shouldPreferViewportCulling(
  totalNodes: number,
  visibleNodes: number,
  threshold = GRAPH_VIRTUALIZATION_NODE_TARGET
): boolean {
  if (totalNodes < threshold) return false;
  return estimateMountedNodeBudget(totalNodes, visibleNodes) < totalNodes;
}
