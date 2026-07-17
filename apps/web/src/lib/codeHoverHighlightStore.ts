/**
 * Code panel → canvas / tab hover highlight, and brief yellow flash for paste/placement.
 * Highlights node(s) on the active graph; outlines the owning graph tab.
 */

export type CodeHoverHighlightState = {
  /** Primary node (legacy / first of a multi-highlight). */
  nodeId: string | null;
  /** All nodes to ring yellow (paste / multi-hover). */
  nodeIds: string[];
  /** Graph tab that owns the mapped node (for tab chrome outline). */
  tabId: string | null;
};

type Listener = () => void;

let state: CodeHoverHighlightState = { nodeId: null, nodeIds: [], tabId: null };
const listeners = new Set<Listener>();
let flashTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

function normalize(next: {
  nodeId?: string | null;
  nodeIds?: string[] | null;
  tabId: string | null;
}): CodeHoverHighlightState {
  const ids =
    next.nodeIds && next.nodeIds.length > 0
      ? [...new Set(next.nodeIds.filter(Boolean))]
      : next.nodeId
        ? [next.nodeId]
        : [];
  return {
    nodeId: ids[0] ?? null,
    nodeIds: ids,
    tabId: next.tabId,
  };
}

export function subscribeCodeHoverHighlight(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCodeHoverHighlightState(): CodeHoverHighlightState {
  return state;
}

/** Primary node id (first highlighted). Prefer `isCodeHoverNode` for rings. */
export function getCodeHoverHighlightNodeId(): string | null {
  return state.nodeId;
}

export function getCodeHoverHighlightNodeIds(): readonly string[] {
  return state.nodeIds;
}

export function isCodeHoverNode(nodeId: string): boolean {
  return state.nodeIds.includes(nodeId);
}

/** Tab id to outline in the graph tab bar. */
export function getCodeHoverHighlightTabId(): string | null {
  return state.tabId;
}

export function setCodeHoverHighlight(next: {
  nodeId?: string | null;
  nodeIds?: string[] | null;
  tabId: string | null;
}): void {
  if (flashTimer) {
    clearTimeout(flashTimer);
    flashTimer = null;
  }
  const normalized = normalize(next);
  if (
    state.nodeId === normalized.nodeId &&
    state.tabId === normalized.tabId &&
    state.nodeIds.length === normalized.nodeIds.length &&
    state.nodeIds.every((id, i) => id === normalized.nodeIds[i])
  ) {
    return;
  }
  state = normalized;
  emit();
}

export function clearCodeHoverHighlight(): void {
  if (flashTimer) {
    clearTimeout(flashTimer);
    flashTimer = null;
  }
  setCodeHoverHighlight({ nodeId: null, nodeIds: [], tabId: null });
}

/** Yellow flash on newly placed nodes (same look as code hover). */
export function flashPlacementHighlight(
  nodeIds: string[],
  tabId: string | null,
  ms = 2800
): void {
  if (nodeIds.length === 0) return;
  setCodeHoverHighlight({ nodeIds, tabId });
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    flashTimer = null;
    state = { nodeId: null, nodeIds: [], tabId: null };
    emit();
  }, ms);
}
