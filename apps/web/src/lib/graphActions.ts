export type GraphAction =
  | 'copy'
  | 'paste'
  | 'cut'
  | 'duplicate'
  | 'delete-selection'
  | 'disconnect-selection'
  | 'focus-selection'
  | 'zoom-fit'
  | 'group-comment'
  | 'ungroup-comment'
  | 'toggle-comment-lock'
  | 'snap-comment-members'
  | 'extract-function'
  | 'select-all'
  | 'select-similar'
  | 'select-chain-downstream'
  | 'select-chain-full'
  | 'layout-selected-chains'
  | 'auto-connect-selection';

export type GraphActionDetail = {
  action: GraphAction;
  /**
   * When false, select-chain-downstream only expands selection (no S→layout arm).
   * Menus should pass false; keyboard S leaves this undefined (arm enabled).
   */
  allowLayoutArm?: boolean;
};

export function dispatchGraphAction(
  action: GraphAction,
  options?: { allowLayoutArm?: boolean }
) {
  window.dispatchEvent(
    new CustomEvent('vvs:graph-action', {
      detail: { action, allowLayoutArm: options?.allowLayoutArm } satisfies GraphActionDetail,
    })
  );
}
