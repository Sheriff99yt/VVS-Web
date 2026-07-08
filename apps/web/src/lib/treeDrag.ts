import { CLASS_DRAG_MIME } from '@/lib/classHelpers';
import { EVENT_DRAG_MIME } from '@/lib/eventHelpers';
import { FUNCTION_OVERLOAD_DRAG_MIME } from '@/lib/functionHelpers';

/** MIME types for project-tree drag sources. */
export const TREE_DRAG_MIME = {
  variable: 'application/vvs-variable',
  functionReorder: 'application/vvs-function',
  functionOverload: FUNCTION_OVERLOAD_DRAG_MIME,
  eventDispatch: EVENT_DRAG_MIME,
  class: CLASS_DRAG_MIME,
  graphContainer: 'application/vvs-graph-container',
} as const;

export type TreeDragEffect = 'copy' | 'move' | 'copyMove';

export interface TreeCanvasDrag {
  mimeType: string;
  payload: string;
  effectAllowed?: TreeDragEffect;
}

export interface GraphContainerDragPayload {
  containerId: string;
}

export function graphContainerDragPayload(containerId: string): string {
  return JSON.stringify({ containerId } satisfies GraphContainerDragPayload);
}

export function parseGraphContainerDragPayload(raw: string): GraphContainerDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as GraphContainerDragPayload;
    if (typeof parsed.containerId === 'string' && parsed.containerId) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Configure a tree row drag onto the graph canvas (copy). */
export function configureCanvasDrag(
  e: React.DragEvent,
  drag: TreeCanvasDrag
): void {
  e.stopPropagation();
  e.dataTransfer.setData(drag.mimeType, drag.payload);
  e.dataTransfer.effectAllowed = drag.effectAllowed ?? 'copy';
}

/** Configure a tree row drag for in-tree reorder (move). */
export function configureTreeReorderDrag(
  e: React.DragEvent,
  mimeType: string,
  payload: string
): void {
  e.stopPropagation();
  e.dataTransfer.setData(mimeType, payload);
  e.dataTransfer.effectAllowed = 'move';
}

/** Configure class drag — canvas declare + folder move. */
export function configureClassTreeDrag(
  e: React.DragEvent,
  payload: string
): void {
  configureCanvasDrag(e, {
    mimeType: TREE_DRAG_MIME.class,
    payload,
    effectAllowed: 'copyMove',
  });
}
