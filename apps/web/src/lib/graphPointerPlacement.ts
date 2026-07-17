/**
 * Last pointer position over the graph — used to place paste / duplicate / new nodes.
 */

export type FlowPoint = { x: number; y: number };

let lastFlow: FlowPoint | null = null;
let pointerOverGraph = false;

/** Call from GraphCanvas on pointer move / leave. */
export function reportGraphPointer(flow: FlowPoint | null, overGraph: boolean): void {
  pointerOverGraph = overGraph;
  if (overGraph && flow) {
    lastFlow = flow;
  }
}

export function isGraphPointerOverCanvas(): boolean {
  return pointerOverGraph && lastFlow != null;
}

/** Flow position under the cursor when over the graph; otherwise `null`. */
export function getLastGraphFlowPosition(): FlowPoint | null {
  return pointerOverGraph ? lastFlow : null;
}

/**
 * Place a clipboard/duplicate group so its bounding-box center lands on `target`.
 */
export function offsetNodesToTarget<T extends { position: FlowPoint }>(
  nodes: T[],
  target: FlowPoint
): T[] {
  if (nodes.length === 0) return nodes;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x);
    maxY = Math.max(maxY, n.position.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  return nodes.map((n) => ({
    ...n,
    position: { x: n.position.x + dx, y: n.position.y + dy },
  }));
}

/** Prefer cursor over graph; else viewport center (caller supplies center). */
export function resolvePlacementFlowPosition(viewportCenter: FlowPoint): FlowPoint {
  return getLastGraphFlowPosition() ?? viewportCenter;
}
