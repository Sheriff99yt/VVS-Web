export interface NavigateToNodeDetail {
  tabId: string;
  nodeId: string;
  /**
   * Optional full set of nodes to select/frame on the canvas. When provided,
   * `nodeId` is still required as the primary (selection / Details / sourceMap
   * focus) but all ids in this array are selected on the target graph and framed
   * by the camera. Used by Code panel drag-to-select (U71 follow-on) to ring
   * every canvas node whose emitted range intersects the drag, plus the existing
   * single-node reverse-select which omits this field.
   */
  nodeIds?: string[];
}

/** Navigate to a graph tab and focus a node (recorded in editor navigation history). */
export function dispatchNavigateToNode(
  tabId: string,
  nodeId: string,
  nodeIds?: string[]
): void {
  const detail: NavigateToNodeDetail = { tabId, nodeId };
  if (nodeIds && nodeIds.length > 0) detail.nodeIds = nodeIds;
  window.dispatchEvent(
    new CustomEvent('vvs:navigate-to-node', {
      detail,
    })
  );
}

/**
 * Multi-node variant of `dispatchNavigateToNode`. Primary is `nodeIds[0]`; the
 * whole array is selected and framed on the target graph. No-op if empty.
 */
export function dispatchNavigateToNodes(tabId: string, nodeIds: string[]): void {
  if (nodeIds.length === 0) return;
  dispatchNavigateToNode(tabId, nodeIds[0]!, nodeIds);
}

/** Jump to the first live/analysis message that has a related graph node. */
export function dispatchFocusFirstValidationError(): void {
  window.dispatchEvent(new CustomEvent('vvs:focus-first-validation-error'));
}

export function dispatchNavigateToVariable(symbolId: string): void {
  window.dispatchEvent(
    new CustomEvent('vvs:navigate-to-variable', {
      detail: { symbolId },
    })
  );
}

/** Prefer errors, then warnings; only messages with both tab + node are navigable. */
export function firstNavigableValidationMessage<
  T extends { level?: string; tabId?: string; nodeId?: string },
>(errors: T[], warnings: T[] = []): T | undefined {
  return (
    errors.find((m) => Boolean(m.tabId && m.nodeId)) ??
    warnings.find((m) => Boolean(m.tabId && m.nodeId))
  );
}

export function navigateToValidationMessage(msg: {
  tabId?: string;
  nodeId?: string;
  symbolId?: string;
}): boolean {
  if (msg.tabId && msg.nodeId) {
    dispatchNavigateToNode(msg.tabId, msg.nodeId);
    return true;
  }
  if (msg.symbolId) {
    dispatchNavigateToVariable(msg.symbolId);
    return true;
  }
  return false;
}
