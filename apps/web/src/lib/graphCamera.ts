/**
 * Shared React Flow camera motion — avoids short linear snaps that stutter
 * when selection + viewport update in the same frame.
 */

export type GraphCameraEase = (t: number) => number;

/** Ease-out cubic — decelerates into the final frame (less “snap”). */
export const graphCameraEaseOut: GraphCameraEase = (t) => 1 - (1 - t) ** 3;

/** Wheel / Controls zoom limits on the edit canvas (RF default minZoom is 0.5). */
export const GRAPH_ZOOM = {
  min: 0.05,
  max: 2,
} as const;

export const GRAPH_CAMERA = {
  /** Focus a selection / single node */
  focusDurationMs: 480,
  focusPadding: 0.45,
  focusMaxZoom: 1.35,
  focusMinZoom: 0.25,
  /** Fit entire graph (F with nothing selected, Zoom to fit) */
  fitAllDurationMs: 520,
  fitAllPadding: 0.22,
  fitAllMaxZoom: 1,
  fitAllMinZoom: GRAPH_ZOOM.min,
  /** First paint / tab open — prefer instant settle over animating from (0,0) */
  openDurationMs: 0,
  openPadding: 0.22,
  openMaxZoom: 1,
  openMinZoom: GRAPH_ZOOM.min,
  interpolate: 'smooth' as const,
} as const;

export type GraphFitViewFn = (options?: {
  nodes?: { id: string }[];
  padding?: number;
  duration?: number;
  minZoom?: number;
  maxZoom?: number;
  ease?: GraphCameraEase;
  interpolate?: 'smooth' | 'linear';
}) => unknown;

export function focusGraphNodes(
  fitView: GraphFitViewFn,
  nodeIds: string[],
  overrides?: { padding?: number; duration?: number }
): void {
  if (nodeIds.length === 0) return;
  fitView({
    nodes: nodeIds.map((id) => ({ id })),
    padding: overrides?.padding ?? GRAPH_CAMERA.focusPadding,
    duration: overrides?.duration ?? GRAPH_CAMERA.focusDurationMs,
    minZoom: GRAPH_CAMERA.focusMinZoom,
    maxZoom: GRAPH_CAMERA.focusMaxZoom,
    ease: graphCameraEaseOut,
    interpolate: GRAPH_CAMERA.interpolate,
  });
}

/** F with nothing selected / Zoom to fit — clamp zoom so huge graphs don’t slam. */
export function fitAllGraphNodes(
  fitView: GraphFitViewFn,
  overrides?: { duration?: number; padding?: number }
): void {
  fitView({
    padding: overrides?.padding ?? GRAPH_CAMERA.fitAllPadding,
    duration: overrides?.duration ?? GRAPH_CAMERA.fitAllDurationMs,
    minZoom: GRAPH_CAMERA.fitAllMinZoom,
    maxZoom: GRAPH_CAMERA.fitAllMaxZoom,
    ease: graphCameraEaseOut,
    interpolate: GRAPH_CAMERA.interpolate,
  });
}

/** Tab open / canvas init — settle without animating from a junk viewport. */
export function openGraphCamera(fitView: GraphFitViewFn): void {
  fitView({
    padding: GRAPH_CAMERA.openPadding,
    duration: GRAPH_CAMERA.openDurationMs,
    minZoom: GRAPH_CAMERA.openMinZoom,
    maxZoom: GRAPH_CAMERA.openMaxZoom,
  });
}
