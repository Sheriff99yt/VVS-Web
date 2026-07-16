export interface NavigateToNodeDetail {
  tabId: string;
  nodeId: string;
}

/** Navigate to a graph tab and focus a node (recorded in editor navigation history). */
export function dispatchNavigateToNode(tabId: string, nodeId: string): void {
  window.dispatchEvent(
    new CustomEvent('vvs:navigate-to-node', {
      detail: { tabId, nodeId } satisfies NavigateToNodeDetail,
    })
  );
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
