import { describe, expect, test } from 'bun:test';
import type { GraphTab } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { closeGraphTab, selectionForGraphTab } from './graphTabs';

const mainTab: GraphTab = { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: 'Main graph' };
const fnA: GraphTab = { id: 'fn-a', type: 'function', name: 'Function: A' };
const fnB: GraphTab = { id: 'fn-b', type: 'function', name: 'Function: B' };
const fnC: GraphTab = { id: 'fn-c', type: 'function', name: 'Function: C' };

describe('closeGraphTab', () => {
  test('closing non-active tab keeps active id', () => {
    const tabs = [mainTab, fnA, fnB];
    const result = closeGraphTab(tabs, fnA.id, fnB.id);
    expect(result.nextTabs.map((t) => t.id)).toEqual([MAIN_GRAPH_CONTAINER_ID, fnB.id]);
    expect(result.nextActiveId).toBe(fnB.id);
  });

  test('closing active tab activates previous sibling', () => {
    const tabs = [mainTab, fnA, fnB, fnC];
    const result = closeGraphTab(tabs, fnB.id, fnB.id);
    expect(result.nextTabs.map((t) => t.id)).toEqual([
      MAIN_GRAPH_CONTAINER_ID,
      fnA.id,
      fnC.id,
    ]);
    expect(result.nextActiveId).toBe(fnA.id);
  });

  test('closing first closeable active tab activates last remaining', () => {
    const tabs = [fnA, fnB];
    const result = closeGraphTab(tabs, fnA.id, fnA.id);
    expect(result.nextTabs.map((t) => t.id)).toEqual([fnB.id]);
    expect(result.nextActiveId).toBe(fnB.id);
  });

  test('closing last closeable tab falls back to main-graph', () => {
    const tabs = [fnA];
    const result = closeGraphTab(tabs, fnA.id, fnA.id);
    expect(result.nextTabs).toEqual([]);
    expect(result.nextActiveId).toBe(MAIN_GRAPH_CONTAINER_ID);
  });

  test('refuses to close pinned main-graph tab', () => {
    const tabs = [mainTab, fnA];
    const result = closeGraphTab(tabs, MAIN_GRAPH_CONTAINER_ID, fnA.id);
    expect(result.nextTabs).toEqual(tabs);
    expect(result.nextActiveId).toBe(fnA.id);
  });
});

describe('selectionForGraphTab', () => {
  test('maps legacy main to null selection id', () => {
    expect(selectionForGraphTab('main')).toEqual({ type: 'graph', id: null });
  });

  test('keeps container / home graph id', () => {
    expect(selectionForGraphTab(MAIN_GRAPH_CONTAINER_ID)).toEqual({
      type: 'graph',
      id: MAIN_GRAPH_CONTAINER_ID,
    });
  });

  test('keeps function tab id', () => {
    expect(selectionForGraphTab('fn-fetch')).toEqual({ type: 'graph', id: 'fn-fetch' });
  });
});
