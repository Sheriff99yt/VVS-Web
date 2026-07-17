import { describe, expect, test } from 'bun:test';
import {
  createNavigationFrame,
  isVvsEditorNavigationFrame,
  navigationFramesEqualForSync,
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

  test('navigationFramesEqualForSync treats graph tab id vs null as same place', () => {
    const a = createNavigationFrame({
      graphTab: 'fn-1',
      selection: { type: 'graph', id: 'fn-1' },
    });
    const b = createNavigationFrame({
      graphTab: 'fn-1',
      selection: { type: 'graph', id: null },
    });
    expect(navigationFramesEqualForSync(a, b)).toBe(true);
  });

  test('viewport round-trips on navigation frames', () => {
    const frame = createNavigationFrame({
      graphTab: 'main',
      viewport: { x: 10, y: 20, zoom: 0.85 },
      cameraKind: 'camera',
    });
    expect(isVvsEditorNavigationFrame(frame)).toBe(true);
    const restored = readNavigationFrameFromHistoryState({
      [VVS_HISTORY_STATE_KEY]: frame,
    });
    expect(restored?.viewport).toEqual({ x: 10, y: 20, zoom: 0.85 });
    expect(restored?.cameraKind).toBe('camera');
  });
});
