import type { ClassSymbol } from '@vvs/graph-types';

export const CLASS_DRAG_MIME = 'application/vvs-class';

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
