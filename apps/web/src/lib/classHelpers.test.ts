import { describe, expect, it } from 'vitest';
import {
  CLASS_DRAG_MIME,
  CLASS_FOLDER_DRAG_MIME,
  classDragPayload,
  isClassDragEvent,
  isClassFolderDragEvent,
  readClassIdFromDragEvent,
  readClassIdFromFolderDragEvent,
} from './classHelpers';
import { createClassSymbol } from '@vvs/graph-types';

function dragEvent(types: string[], data: Record<string, string> = {}): DragEvent {
  return {
    dataTransfer: {
      types,
      getData: (mime: string) => data[mime] ?? '',
    },
  } as unknown as DragEvent;
}

describe('classHelpers drag', () => {
  it('detects canvas vs folder class drag mime', () => {
    expect(isClassDragEvent(dragEvent([CLASS_DRAG_MIME]))).toBe(true);
    expect(isClassFolderDragEvent(dragEvent([CLASS_FOLDER_DRAG_MIME]))).toBe(true);
    expect(isClassDragEvent(dragEvent([CLASS_FOLDER_DRAG_MIME]))).toBe(false);
  });

  it('reads class id from canvas and folder payloads', () => {
    const cls = createClassSymbol('Calc', { id: 'cls-1' });
    const payload = classDragPayload(cls);
    expect(readClassIdFromDragEvent(dragEvent([CLASS_DRAG_MIME], { [CLASS_DRAG_MIME]: payload }))).toBe(
      'cls-1'
    );
    expect(
      readClassIdFromFolderDragEvent(
        dragEvent([CLASS_FOLDER_DRAG_MIME], { [CLASS_FOLDER_DRAG_MIME]: payload })
      )
    ).toBe('cls-1');
  });
});
