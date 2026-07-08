import { describe, expect, test } from 'bun:test';
import {
  createNavigationFrame,
  isVvsEditorNavigationFrame,
  readNavigationFrameFromHistoryState,
} from './editorNavigationHistory';
import { VVS_HISTORY_STATE_KEY } from '@/types/editorNavigation';

describe('editorNavigationHistory', () => {
  test('isVvsEditorNavigationFrame accepts tree symbol selection types', () => {
    for (const type of ['event', 'function', 'class'] as const) {
      const frame = createNavigationFrame({
        graphTab: 'calc-calculator-graph',
        selection: { type, id: 'symbol-id' },
      });
      expect(isVvsEditorNavigationFrame(frame)).toBe(true);
    }
  });

  test('readNavigationFrameFromHistoryState round-trips tree symbol frames', () => {
    const frame = createNavigationFrame({
      graphTab: 'calc-calculator-graph',
      editorView: 'canvas',
      selection: { type: 'event', id: 'evt-calc' },
    });

    const state = { [VVS_HISTORY_STATE_KEY]: frame };
    const restored = readNavigationFrameFromHistoryState(state);

    expect(restored).not.toBeNull();
    expect(restored!.selection).toEqual({ type: 'event', id: 'evt-calc' });
    expect(restored!.graphTab).toBe('calc-calculator-graph');
  });
});
