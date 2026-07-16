import { CLASS_DRAG_MIME, CLASS_FOLDER_DRAG_MIME } from '@/lib/classHelpers';
import { EVENT_DRAG_MIME } from '@/lib/eventHelpers';
import { FUNCTION_OVERLOAD_DRAG_MIME } from '@/lib/functionHelpers';
import {
  beginSymbolReorder,
  encodeReorderTextPlain,
  endSymbolReorder,
  parseReorderTextPlain,
  peekSymbolReorder,
} from '@/lib/symbolReorderSession';

/** MIME types for project-tree drag sources. */
export const TREE_DRAG_MIME = {
  variable: 'application/vvs-variable',
  variableReorder: 'application/vvs-variable-reorder',
  functionReorder: 'application/vvs-function',
  functionOverload: FUNCTION_OVERLOAD_DRAG_MIME,
  eventDispatch: EVENT_DRAG_MIME,
  eventReorder: 'application/vvs-event-reorder',
  class: CLASS_DRAG_MIME,
  classFolder: CLASS_FOLDER_DRAG_MIME,
  classReorder: 'application/vvs-class-reorder',
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

/**
 * Configure an in-tree reorder drag.
 * Starts a sync session so dragover works before React state commits.
 */
export function configureTreeReorderDrag(
  e: React.DragEvent,
  mimeType: string,
  payload: string,
  options?: { effectAllowed?: TreeDragEffect; extraData?: Record<string, string> }
): void {
  e.stopPropagation();
  beginSymbolReorder(mimeType, payload);
  e.dataTransfer.setData(mimeType, payload);
  e.dataTransfer.setData('text/plain', encodeReorderTextPlain(mimeType, payload));
  if (options?.extraData) {
    for (const [key, value] of Object.entries(options.extraData)) {
      e.dataTransfer.setData(key, value);
    }
  }
  e.dataTransfer.effectAllowed = options?.effectAllowed ?? 'move';
}

/** End reorder session (call from dragend / successful drop). */
export function clearTreeReorderDrag(): void {
  endSymbolReorder();
}

/** Resolve reorder source id from drop event, sync session, or React state fallback. */
export function readTreeReorderId(
  e: React.DragEvent,
  mimeType: string,
  fallbackId?: string | null
): string | null {
  const fromMime =
    e.dataTransfer.getData(mimeType) || e.dataTransfer.getData(mimeType.toLowerCase());
  if (fromMime) return fromMime;
  const fromPlain = parseReorderTextPlain(e.dataTransfer.getData('text/plain'), mimeType);
  if (fromPlain) return fromPlain;
  return peekSymbolReorder(mimeType) ?? fallbackId ?? null;
}

/** True when this drag is our reorder (session, MIME in types, or React id). */
export function isTreeReorderDrag(
  e: React.DragEvent,
  mimeType: string,
  draggingId?: string | null
): boolean {
  if (peekSymbolReorder(mimeType) || draggingId) return true;
  const types = Array.from(e.dataTransfer.types);
  const mimeLower = mimeType.toLowerCase();
  return types.some((t) => t === mimeType || t.toLowerCase() === mimeLower);
}

/** Configure class grip drag — move between output folders only. */
export function configureClassFolderDrag(
  e: React.DragEvent,
  payload: string
): void {
  configureTreeReorderDrag(e, TREE_DRAG_MIME.classFolder, payload);
}
