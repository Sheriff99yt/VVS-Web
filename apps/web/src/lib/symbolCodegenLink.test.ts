import { describe, expect, test } from 'bun:test';
import { createComplexExampleSnapshot } from './examples/complexExample';
import { resolveSymbolCodegenLink } from './symbolCodegenLink';
import { resolveCodePreviewHighlightNodeIds } from './projectSelection';

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

  test('function selection prefers active overload graph tab', () => {
    const func = snapshot.functions.find((f) => f.id === 'fn-add')!;
    const overloadTab = func.overloads[0]?.graphTabId ?? func.id;

    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: overloadTab,
      selection: { type: 'function', id: 'fn-add' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(overloadTab);
  });

  test('dispatch node canvas selection highlights dispatch not member define', () => {
    const eventLink = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-calc' },
    });

    const highlightNodeIds = resolveCodePreviewHighlightNodeIds(
      { type: 'event', id: 'evt-calc' },
      ['calc-dispatch'],
      eventLink?.highlightNodeIds
    );

    expect(highlightNodeIds).toEqual(['calc-dispatch']);
    expect(highlightNodeIds).not.toContain('calc-evt-calc-member');
  });

  test('node selection resolves to selected dispatch id for codegen link', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: CALCULATOR_GRAPH_ID,
      selectedNodeIds: ['calc-dispatch'],
      selection: { type: 'node', id: 'calc-dispatch' },
    });

    expect(link).not.toBeNull();
    expect(link!.highlightNodeIds).toEqual(['calc-dispatch']);
    expect(link!.primaryNodeId).toBe('calc-dispatch');
  });
});
