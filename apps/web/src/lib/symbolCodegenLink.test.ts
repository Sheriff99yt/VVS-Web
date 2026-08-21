import { describe, expect, test } from 'bun:test';
import { createComplexSnapshot } from './usabilityExampleTests/complexUsabilityTest';
import { resolveSymbolCodegenLink } from './symbolCodegenLink';
import { resolveCodePreviewHighlightNodeIds } from './projectSelection';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('resolveSymbolCodegenLink', () => {
  const snapshot = createComplexSnapshot();
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

  test('evt-start links to home graph and highlights member define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-start' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(link!.highlightNodeIds).toContain('cx-start-mem');
    expect(link!.primaryNodeId).toBe('cx-start-mem');
  });

  test('var-total links to home graph and highlights var define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'variable', id: 'var-total' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(link!.highlightNodeIds).toContain('cx-var-total');
    expect(link!.primaryNodeId).toBe('cx-var-total');
  });

  test('fn-add links to function graph and highlights function entry', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'function', id: 'fn-add' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe('fn-add');
    expect(link!.highlightNodeIds).toContain('cx-add-entry');
    expect(link!.primaryNodeId).toBe('cx-add-entry');
  });

  test('node selection falls back to active tab and selected node ids', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
      selectedNodeIds: ['cx-call-add'],
      selection: { type: 'node', id: 'cx-call-add' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(link!.highlightNodeIds).toEqual(['cx-call-add']);
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

  test('multi tree selection merges highlight node ids', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'variable', id: 'var-total' },
      selectedTreeSymbols: [
        { kind: 'variable', id: 'var-total' },
        { kind: 'event', id: 'evt-start' },
      ],
    });

    expect(link).not.toBeNull();
    expect(link!.highlightNodeIds).toContain('cx-var-total');
    expect(link!.highlightNodeIds).toContain('cx-start-mem');
  });

  test('class selection highlights class_define', () => {
    const cls = snapshot.classes![0]!;
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'class', id: cls.id },
      selectedTreeSymbols: [{ kind: 'class', id: cls.id }],
    });

    expect(link).not.toBeNull();
    expect(link!.highlightNodeIds.length).toBeGreaterThan(0);
  });

  test('dispatch node canvas selection highlights dispatch not member define', () => {
    const eventLink = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-start' },
    });

    const highlightNodeIds = resolveCodePreviewHighlightNodeIds(
      { type: 'event', id: 'evt-start' },
      ['cx-call-add'],
      eventLink?.highlightNodeIds
    );

    expect(highlightNodeIds).toEqual(['cx-call-add']);
    expect(highlightNodeIds).not.toContain('cx-start-mem');
  });
});
