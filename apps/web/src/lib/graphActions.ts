export type GraphAction =
  | 'copy'
  | 'paste'
  | 'cut'
  | 'duplicate'
  | 'zoom-fit'
  | 'group-comment'
  | 'ungroup-comment';

export function dispatchGraphAction(action: GraphAction) {
  window.dispatchEvent(new CustomEvent('vvs:graph-action', { detail: { action } }));
}

export function dispatchNodeAction(action: 'duplicate-node' | 'delete-node', nodeId: string) {
  window.dispatchEvent(new CustomEvent('vvs:node-action', { detail: { action, nodeId } }));
}
