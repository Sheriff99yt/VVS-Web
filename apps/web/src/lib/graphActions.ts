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
  | 'select-similar';

export function dispatchGraphAction(action: GraphAction) {
  window.dispatchEvent(new CustomEvent('vvs:graph-action', { detail: { action } }));
}

