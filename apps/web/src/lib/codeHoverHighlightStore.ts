/**
 * Code panel → canvas / tab hover highlight (no selection / camera).
 * Highlights the node when it lives on the active graph; always outlines the
 * owning graph tab (current or other).
 */

export type CodeHoverHighlightState = {
  nodeId: string | null;
  /** Graph tab that owns the mapped node (for tab chrome outline). */
  tabId: string | null;
};

type Listener = () => void;

let state: CodeHoverHighlightState = { nodeId: null, tabId: null };
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeCodeHoverHighlight(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCodeHoverHighlightState(): CodeHoverHighlightState {
  return state;
}

/** Node id to ring on the canvas (only when that node is on the active tab). */
export function getCodeHoverHighlightNodeId(): string | null {
  return state.nodeId;
}

/** Tab id to outline in the graph tab bar. */
export function getCodeHoverHighlightTabId(): string | null {
  return state.tabId;
}

export function setCodeHoverHighlight(next: CodeHoverHighlightState): void {
  if (state.nodeId === next.nodeId && state.tabId === next.tabId) return;
  state = next;
  emit();
}

export function clearCodeHoverHighlight(): void {
  setCodeHoverHighlight({ nodeId: null, tabId: null });
}
