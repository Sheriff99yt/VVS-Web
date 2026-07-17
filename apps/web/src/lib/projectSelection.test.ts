import { describe, expect, test } from 'bun:test';
import { clearCanvasSelectionKeepTreeSymbol, isTreeSymbolSelection, resolveCodePreviewHighlightNodeIds, selectionFromCanvasNodes } from './projectSelection';

describe('projectSelection', () => {
  test('isTreeSymbolSelection recognizes tree symbol types', () => {
    expect(isTreeSymbolSelection('event')).toBe(true);
    expect(isTreeSymbolSelection('variable')).toBe(true);
    expect(isTreeSymbolSelection('function')).toBe(true);
    expect(isTreeSymbolSelection('class')).toBe(true);
    expect(isTreeSymbolSelection('node')).toBe(false);
    expect(isTreeSymbolSelection('graph')).toBe(false);
  });

  test('clearCanvasSelectionKeepTreeSymbol preserves tree symbols', () => {
    expect(
      clearCanvasSelectionKeepTreeSymbol({ type: 'event', id: 'evt-calc' })
    ).toEqual({ type: 'event', id: 'evt-calc' });
    expect(
      clearCanvasSelectionKeepTreeSymbol({ type: 'function', id: 'fn-add' })
    ).toEqual({ type: 'function', id: 'fn-add' });
  });

  test('clearCanvasSelectionKeepTreeSymbol preserves code preview selection', () => {
    expect(
      clearCanvasSelectionKeepTreeSymbol({ type: 'code', id: 'src/Main.py' })
    ).toEqual({ type: 'code', id: 'src/Main.py' });
  });

  test('clearCanvasSelectionKeepTreeSymbol clears node and graph picks', () => {
    expect(clearCanvasSelectionKeepTreeSymbol({ type: 'node', id: 'n1' })).toEqual({
      type: 'graph',
      id: null,
    });
    expect(clearCanvasSelectionKeepTreeSymbol({ type: 'graph', id: 'main-graph' })).toEqual({
      type: 'graph',
      id: null,
    });
    expect(clearCanvasSelectionKeepTreeSymbol({ type: 'graph', id: null })).toEqual({
      type: 'graph',
      id: null,
    });
  });

  test('selectionFromCanvasNodes overrides tree symbol when nodes are selected', () => {
    expect(
      selectionFromCanvasNodes({ type: 'event', id: 'evt-calc' }, ['calc-dispatch'])
    ).toEqual({ type: 'node', id: 'calc-dispatch' });
  });

  test('selectionFromCanvasNodes preserves tree symbol on deselect', () => {
    expect(selectionFromCanvasNodes({ type: 'event', id: 'evt-calc' }, [])).toEqual({
      type: 'event',
      id: 'evt-calc',
    });
  });

  test('resolveCodePreviewHighlightNodeIds prefers canvas node ids over tree symbol link', () => {
    expect(
      resolveCodePreviewHighlightNodeIds(
        { type: 'event', id: 'evt-calc' },
        ['calc-dispatch'],
        ['calc-evt-calc-member']
      )
    ).toEqual(['calc-dispatch']);
  });

  test('resolveCodePreviewHighlightNodeIds falls back to symbol link for tree-only focus', () => {
    expect(
      resolveCodePreviewHighlightNodeIds(
        { type: 'event', id: 'evt-calc' },
        [],
        ['calc-evt-calc-member']
      )
    ).toEqual(['calc-evt-calc-member']);
  });
});
