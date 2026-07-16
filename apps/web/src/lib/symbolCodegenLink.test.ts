import { describe, expect, test } from 'bun:test';
import { createCoverageLabUsabilityTestSnapshot } from './usabilityExampleTests/coverageLabUsabilityTest';
import { resolveSymbolCodegenLink } from './symbolCodegenLink';
import { resolveCodePreviewHighlightNodeIds } from './projectSelection';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('resolveSymbolCodegenLink', () => {
  const snapshot = createCoverageLabUsabilityTestSnapshot();
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

  test('evt-pulse links to home graph and highlights member define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-pulse' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(link!.highlightNodeIds).toContain('lab-evt-pulse-mem');
    expect(link!.primaryNodeId).toBe('lab-evt-pulse-mem');
  });

  test('var-power links to home graph and highlights var define', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'variable', id: 'var-power' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(link!.highlightNodeIds).toContain('lab-var-power');
    expect(link!.primaryNodeId).toBe('lab-var-power');
  });

  test('fn-boot links to function graph and highlights function entry', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'function', id: 'fn-boot' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe('fn-boot');
    expect(link!.highlightNodeIds).toContain('lab-boot-entry');
    expect(link!.primaryNodeId).toBe('lab-boot-entry');
  });

  test('node selection falls back to active tab and selected node ids', () => {
    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
      selectedNodeIds: ['lab-dispatch-pulse'],
      selection: { type: 'node', id: 'lab-dispatch-pulse' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(link!.highlightNodeIds).toEqual(['lab-dispatch-pulse']);
  });

  test('function selection prefers active overload graph tab', () => {
    const func = snapshot.functions.find((f) => f.id === 'fn-boot')!;
    const overloadTab = func.overloads[0]?.graphTabId ?? func.id;

    const link = resolveSymbolCodegenLink({
      ...baseInput,
      activeGraphTab: overloadTab,
      selection: { type: 'function', id: 'fn-boot' },
    });

    expect(link).not.toBeNull();
    expect(link!.tabId).toBe(overloadTab);
  });

  test('dispatch node canvas selection highlights dispatch not member define', () => {
    const eventLink = resolveSymbolCodegenLink({
      ...baseInput,
      selection: { type: 'event', id: 'evt-pulse' },
    });

    const highlightNodeIds = resolveCodePreviewHighlightNodeIds(
      { type: 'event', id: 'evt-pulse' },
      ['lab-dispatch-pulse'],
      eventLink?.highlightNodeIds
    );

    expect(highlightNodeIds).toEqual(['lab-dispatch-pulse']);
    expect(highlightNodeIds).not.toContain('lab-evt-pulse-mem');
  });
});
