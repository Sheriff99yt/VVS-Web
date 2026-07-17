/**
 * Shared node options strip target — one strip for the canvas, not per-node DOM.
 * Hover mode rebinds this id; select mode ignores it (reads RF selection instead).
 */

export type HoverChromeState = {
  /** Node under pointer (hover mode). */
  hoveredNodeId: string | null;
  /** Keep strip while pointer is over the shared strip. */
  stripHovered: boolean;
  /** Keep strip while a modifier dropdown is open. */
  menuPinned: boolean;
};

type Listener = () => void;

let state: HoverChromeState = {
  hoveredNodeId: null,
  stripHovered: false,
  menuPinned: false,
};

const listeners = new Set<Listener>();
let clearTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

function clearClearTimer() {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

function shouldHold(): boolean {
  return state.stripHovered || state.menuPinned;
}

export function subscribeHoverChrome(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHoverChromeState(): HoverChromeState {
  return state;
}

/** Effective node for the shared strip in hover mode. */
export function getHoverChromeNodeId(): string | null {
  return state.hoveredNodeId;
}

export function hoverChromeSetHoveredNode(nodeId: string | null): void {
  clearClearTimer();
  if (nodeId) {
    if (state.hoveredNodeId === nodeId) return;
    state = { ...state, hoveredNodeId: nodeId };
    emit();
    return;
  }
  // Leaving a node — delay clear so the pointer can reach the strip above.
  clearTimer = setTimeout(() => {
    clearTimer = null;
    if (shouldHold()) return;
    if (state.hoveredNodeId == null) return;
    state = { ...state, hoveredNodeId: null };
    emit();
  }, 120);
}

export function hoverChromeSetStripHovered(hovered: boolean): void {
  clearClearTimer();
  if (state.stripHovered === hovered) return;
  state = { ...state, stripHovered: hovered };
  emit();
  if (!hovered && !state.menuPinned && state.hoveredNodeId) {
    clearTimer = setTimeout(() => {
      clearTimer = null;
      if (shouldHold()) return;
      state = { ...state, hoveredNodeId: null };
      emit();
    }, 80);
  }
}

export function hoverChromeSetMenuPinned(pinned: boolean): void {
  clearClearTimer();
  if (state.menuPinned === pinned) return;
  state = { ...state, menuPinned: pinned };
  emit();
  if (!pinned && !state.stripHovered && state.hoveredNodeId) {
    clearTimer = setTimeout(() => {
      clearTimer = null;
      if (shouldHold()) return;
      state = { ...state, hoveredNodeId: null };
      emit();
    }, 80);
  }
}

export function hoverChromeClear(): void {
  clearClearTimer();
  if (
    state.hoveredNodeId == null &&
    !state.stripHovered &&
    !state.menuPinned
  ) {
    return;
  }
  state = { hoveredNodeId: null, stripHovered: false, menuPinned: false };
  emit();
}
