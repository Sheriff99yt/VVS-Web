import { describe, expect, test } from 'bun:test';
import { createComplexExampleSnapshot } from './examples/complexExample';
import { resolveSymbolCodegenLink } from './symbolCodegenLink';

const CALCULATOR_GRAPH_ID = 'calc-calculator-graph';

describe('resolveSymbolCodegenLink', () => {
  const snapshot = createComplexExampleSnapshot();
  const documents = snapshot.documents!;
  const baseInput = {
    documents,
    classes: snapshot.classes!,
    functions: snapshot.functions,
    events: snapshot.events,
    variables: snapshot.variables,
    activeGraphTab: snapshot.activeGraphTab,
    selectedNodeIds: [] as string[],
  };

  test('evt-calc links to calculator graph and highlights member define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-calc' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(CALCULATOR_GRAPH_ID);
    expect(link!.highlightNodeIds).toContain('calc-evt-calc-member');
    expect(link!.primaryNodeId).toBe('calc-evt-calc-member');
  });

  test('evt-clear links to calculator graph and highlights member define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-clear' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(CALCULATOR_GRAPH_ID);
    expect(link!.highlightNodeIds).toContain('calc-evt-clear-member');
    expect(link!.primaryNodeId).toBe('calc-evt-clear-member');
  });

  test('var-a links to calculator graph and highlights var define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'variable', id: 'var-a' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(CALCULATOR_GRAPH_ID);
    expect(link!.highlightNodeIds).toContain('calc-var-a-define');
    expect(link!.primaryNodeId).toBe('calc-var-a-define');
  });

  test('fn-add links to function graph and highlights function entry', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'function', id: 'fn-add' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe('fn-add');
    expect(link!.highlightNodeIds).toContain('calc-add-entry');
    expect(link!.primaryNodeId).toBe('calc-add-entry');
  });

  test('node selection falls back to active tab and selected node ids', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: CALCULATOR_GRAPH_ID,
      selectedNodeIds: ['calc-set-a'],
      selection: { type: 'node', id: 'calc-set-a' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(CALCULATOR_GRAPH_ID);
    expect(link!.highlightNodeIds).toEqual(['calc-set-a']);
  });

  test('symbol selection previews calculator graph while on project map', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: 'main-graph',
      selection: { type: 'event', id: 'evt-calc' },
    });

    expect(link!.tabId).toBe(CALCULATOR_GRAPH_ID);
  });
});
