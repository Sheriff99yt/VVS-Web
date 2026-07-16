import { describe, expect, it } from 'vitest';
import {
  beginSymbolReorder,
  endSymbolReorder,
  encodeReorderTextPlain,
  parseReorderTextPlain,
  peekSymbolReorder,
} from '@/lib/symbolReorderSession';
import { readTreeReorderId, TREE_DRAG_MIME } from '@/lib/treeDrag';

describe('symbolReorderSession', () => {
  it('tracks active reorder synchronously', () => {
    endSymbolReorder();
    expect(peekSymbolReorder(TREE_DRAG_MIME.classReorder)).toBeNull();
    beginSymbolReorder(TREE_DRAG_MIME.classReorder, 'class-a');
    expect(peekSymbolReorder(TREE_DRAG_MIME.classReorder)).toBe('class-a');
    expect(peekSymbolReorder(TREE_DRAG_MIME.variableReorder)).toBeNull();
    endSymbolReorder();
    expect(peekSymbolReorder(TREE_DRAG_MIME.classReorder)).toBeNull();
  });

  it('round-trips text/plain encoding', () => {
    const raw = encodeReorderTextPlain(TREE_DRAG_MIME.variableReorder, 'var-1');
    expect(parseReorderTextPlain(raw, TREE_DRAG_MIME.variableReorder)).toBe('var-1');
    expect(parseReorderTextPlain(raw, TREE_DRAG_MIME.classReorder)).toBeNull();
  });
});

describe('readTreeReorderId', () => {
  it('prefers mime data, then plain, then session', () => {
    endSymbolReorder();
    beginSymbolReorder(TREE_DRAG_MIME.classReorder, 'from-session');
    const e = {
      dataTransfer: {
        getData: (type: string) => {
          if (type === TREE_DRAG_MIME.classReorder) return '';
          if (type === 'text/plain') return '';
          return '';
        },
      },
    } as unknown as React.DragEvent;
    expect(readTreeReorderId(e, TREE_DRAG_MIME.classReorder, 'fallback')).toBe('from-session');
    endSymbolReorder();
  });
});
