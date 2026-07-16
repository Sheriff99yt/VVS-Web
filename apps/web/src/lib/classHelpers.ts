import type { DragEvent } from 'react';
import type { ClassSymbol } from '@vvs/graph-types';

export const CLASS_DRAG_MIME = 'application/vvs-class';
/** Grip-only drag for moving a class between output folders (not canvas). */
export const CLASS_FOLDER_DRAG_MIME = 'application/vvs-class-folder';

export interface ClassDragPayload {
  classId: string;
}

export function classDragPayload(cls: ClassSymbol): string {
  return JSON.stringify({ classId: cls.id } satisfies ClassDragPayload);
}

export function parseClassDragPayload(raw: string): ClassDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as ClassDragPayload;
    if (typeof parsed.classId === 'string' && parsed.classId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function isClassDragEvent(e: DragEvent): boolean {
  return e.dataTransfer.types.includes(CLASS_DRAG_MIME);
}

export function isClassFolderDragEvent(e: DragEvent): boolean {
  const types = Array.from(e.dataTransfer.types);
  const mime = CLASS_FOLDER_DRAG_MIME.toLowerCase();
  return types.some((t) => t === CLASS_FOLDER_DRAG_MIME || t.toLowerCase() === mime);
}

export function readClassIdFromDragEvent(
  e: DragEvent,
  fallbackClassId?: string | null
): string | null {
  const raw = e.dataTransfer.getData(CLASS_DRAG_MIME);
  const payload = raw ? parseClassDragPayload(raw) : null;
  return payload?.classId ?? fallbackClassId ?? null;
}

export function readClassIdFromFolderDragEvent(
  e: DragEvent,
  fallbackClassId?: string | null
): string | null {
  const raw = e.dataTransfer.getData(CLASS_FOLDER_DRAG_MIME);
  const payload = raw ? parseClassDragPayload(raw) : null;
  return payload?.classId ?? fallbackClassId ?? null;
}
