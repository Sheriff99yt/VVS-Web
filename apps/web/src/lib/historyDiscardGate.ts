/**
 * Gate edits that would discard newer History (redo) states.
 *
 * Policy:
 * - Undo / redo never prompt — they are committed timeline steps (redo still works
 *   until the next edit, which silently drops the redo stack).
 * - Clicking a History list entry enters *browse preview*; a divergent edit then
 *   opens this dialog.
 * - Discard runs the pending edit once (no second click).
 * - Jump to latest restores the tip of the redo stack and abandons the edit.
 */

export const OPEN_LOG_HISTORY_TAB_EVENT = 'vvs:open-log-history-tab';
export const HIGHLIGHT_LOG_HISTORY_EVENT = 'vvs:highlight-log-history';

export type HistoryDiscardGateState = {
  open: boolean;
  newerCount: number;
};

type Listener = () => void;
type ProceedFn = () => void;

let gateState: HistoryDiscardGateState = { open: false, newerCount: 0 };
/** After Cancel, ignore further prompts until the current pointer/key gesture ends. */
let suppressUntilGestureEnd = false;
/** True while undo/redo/jump apply snapshots — never prompt or record new history. */
let applyingHistoryDepth = 0;
/**
 * True after the user clicks a History list row (browse). Undo/redo clear this —
 * those commits do not require a discard confirm on the next edit.
 */
let historyBrowsePreview = false;
let clearFuturesFn: (() => void) | null = null;
let jumpToLatestFn: (() => void) | null = null;
let pendingProceed: ProceedFn | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

function endSuppressOnGestureEnd(): void {
  if (typeof window === 'undefined') {
    suppressUntilGestureEnd = false;
    return;
  }
  const clear = () => {
    suppressUntilGestureEnd = false;
    window.removeEventListener('pointerup', clear);
    window.removeEventListener('pointercancel', clear);
    window.removeEventListener('keyup', clear);
  };
  window.addEventListener('pointerup', clear);
  window.addEventListener('pointercancel', clear);
  window.addEventListener('keyup', clear);
}

export function getHistoryDiscardGateState(): HistoryDiscardGateState {
  return gateState;
}

export function subscribeHistoryDiscardGate(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function beginApplyingHistory(): void {
  applyingHistoryDepth += 1;
}

export function endApplyingHistory(): void {
  // Stay suppressed through React commit + React Flow change handlers that may
  // run after undo/redo apply (microtasks alone can clear too early).
  setTimeout(() => {
    applyingHistoryDepth = Math.max(0, applyingHistoryDepth - 1);
  }, 0);
}

export function isApplyingHistory(): boolean {
  return applyingHistoryDepth > 0;
}

/** History list jump → preview; undo/redo/jump-to-latest → committed. */
export function setHistoryBrowsePreview(active: boolean): void {
  historyBrowsePreview = active;
}

export function isHistoryBrowsePreview(): boolean {
  return historyBrowsePreview;
}

/** useGraphState registers this so Confirm can clear the future stack. */
export function registerHistoryDiscardClearer(fn: (() => void) | null): () => void {
  clearFuturesFn = fn;
  return () => {
    if (clearFuturesFn === fn) clearFuturesFn = null;
  };
}

/** useGraphState registers redo-to-tip for “Jump to latest”. */
export function registerHistoryJumpToLatest(fn: (() => void) | null): () => void {
  jumpToLatestFn = fn;
  return () => {
    if (jumpToLatestFn === fn) jumpToLatestFn = null;
  };
}

export function dispatchOpenLogHistoryTab(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_LOG_HISTORY_TAB_EVENT));
}

export function dispatchHighlightLogHistory(ms = 4500): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HIGHLIGHT_LOG_HISTORY_EVENT, { detail: { ms } }));
}

/**
 * Run `proceed` now, or after the user discards newer History.
 * Returns true if `proceed` already ran; false if waiting on the dialog / suppressed.
 */
export function requestHistoryEditGate(newerCount: number, proceed: ProceedFn): boolean {
  if (typeof window === 'undefined' || newerCount <= 0 || isApplyingHistory()) {
    proceed();
    return true;
  }

  // Undo/redo left a redo stack, but that is a committed tip — drop redo silently.
  if (!historyBrowsePreview) {
    clearFuturesFn?.();
    proceed();
    return true;
  }

  if (suppressUntilGestureEnd) return false;

  pendingProceed = proceed;
  if (!gateState.open) {
    gateState = { open: true, newerCount };
    dispatchOpenLogHistoryTab();
    dispatchHighlightLogHistory(5000);
    notify();
  } else if (gateState.newerCount !== newerCount) {
    gateState = { open: true, newerCount };
    notify();
  }
  return false;
}

/**
 * @deprecated Prefer requestHistoryEditGate — kept for call sites that only need a boolean.
 * Always returns false when a prompt is shown (edit must be pending via requestHistoryEditGate).
 */
export function confirmDiscardNewerHistory(newerCount: number): boolean {
  if (typeof window === 'undefined') return true;
  if (newerCount <= 0) return true;
  if (isApplyingHistory()) return true;
  if (!historyBrowsePreview) {
    clearFuturesFn?.();
    return true;
  }
  if (suppressUntilGestureEnd) return false;
  if (gateState.open) return false;
  gateState = { open: true, newerCount };
  dispatchOpenLogHistoryTab();
  dispatchHighlightLogHistory(5000);
  notify();
  return false;
}

/** Discard newer states and run the pending edit once. */
export function acceptHistoryDiscard(): void {
  historyBrowsePreview = false;
  clearFuturesFn?.();
  const run = pendingProceed;
  pendingProceed = null;
  gateState = { open: false, newerCount: 0 };
  suppressUntilGestureEnd = false;
  notify();
  queueMicrotask(() => run?.());
}

/** Restore the newest History tip; abandon the pending edit. */
export function jumpToLatestHistory(): void {
  historyBrowsePreview = false;
  pendingProceed = null;
  gateState = { open: false, newerCount: 0 };
  suppressUntilGestureEnd = false;
  notify();
  queueMicrotask(() => jumpToLatestFn?.());
}

export function cancelHistoryDiscard(): void {
  pendingProceed = null;
  gateState = { open: false, newerCount: 0 };
  suppressUntilGestureEnd = true;
  notify();
  endSuppressOnGestureEnd();
}

/** Close dialog + pending proceed (e.g. history cleared). */
export function resetHistoryDiscardGate(): void {
  historyBrowsePreview = false;
  pendingProceed = null;
  gateState = { open: false, newerCount: 0 };
  suppressUntilGestureEnd = false;
  notify();
}
