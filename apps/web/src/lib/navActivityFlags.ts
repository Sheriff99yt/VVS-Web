/**
 * Soft flags for mouse-navigation camera dwell coalesce.
 * Graph undo stacks stay separate — these only classify camera bookmarks.
 */

let graphEditSinceCamera = false;
let nodeOptionsSinceCamera = false;

export function markNavGraphEdit(): void {
  graphEditSinceCamera = true;
}

export function markNavNodeOptions(): void {
  nodeOptionsSinceCamera = true;
}

export type NavCameraKind = 'camera' | 'after-graph-edit' | 'after-node-options';

/** Read + clear flags; decide cameraKind for the next dwell bookmark. */
export function consumeNavCameraKind(): NavCameraKind {
  if (graphEditSinceCamera) {
    graphEditSinceCamera = false;
    nodeOptionsSinceCamera = false;
    return 'after-graph-edit';
  }
  if (nodeOptionsSinceCamera) {
    nodeOptionsSinceCamera = false;
    return 'after-node-options';
  }
  return 'camera';
}

export function peekNavHasEditsSinceCamera(): boolean {
  return graphEditSinceCamera || nodeOptionsSinceCamera;
}
