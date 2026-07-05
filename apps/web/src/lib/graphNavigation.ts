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
