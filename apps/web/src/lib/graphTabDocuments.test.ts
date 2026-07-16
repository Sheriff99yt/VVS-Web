import { describe, expect, test } from 'bun:test';
import { shouldRetainGraphDocument } from '@/hooks/useGraphTabSync';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { planSymbolDelete } from '@/lib/symbolLifecycle';
import { createFunctionSymbol } from '@/lib/functionTabs';

describe('shouldRetainGraphDocument', () => {
  const containers = new Set([MAIN_GRAPH_CONTAINER_ID, 'graph-home']);
  const functions = new Set(['func-a']);

  test('retains pinned containers even when not open', () => {
    expect(
      shouldRetainGraphDocument(MAIN_GRAPH_CONTAINER_ID, {
        openTabIds: new Set(),
        graphContainerIds: containers,
        functionIds: functions,
      })
    ).toBe(true);
  });

  test('retains function body when tab is closed', () => {
    expect(
      shouldRetainGraphDocument('func-a', {
        openTabIds: new Set([MAIN_GRAPH_CONTAINER_ID]),
        graphContainerIds: containers,
        functionIds: functions,
      })
    ).toBe(true);
  });

  test('drops orphan docs that are neither open nor function-backed', () => {
    expect(
      shouldRetainGraphDocument('orphan-tab', {
        openTabIds: new Set([MAIN_GRAPH_CONTAINER_ID]),
        graphContainerIds: containers,
        functionIds: functions,
      })
    ).toBe(false);
  });
});

describe('planSymbolDelete function documents', () => {
  test('symbol_only removes function body document and closes tab', () => {
    const func = createFunctionSymbol('Boot');
    const plan = planSymbolDelete(
      'function',
      func.id,
      'symbol_only',
      {
        variables: [],
        functions: [func],
        events: [],
        openTabs: [
          { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: 'Project map' },
          { id: func.id, type: 'function', name: 'Function: Boot' },
        ],
      },
      {
        [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] },
        [func.id]: {
          nodes: [{ id: 'n1', type: 'vvs', position: { x: 0, y: 0 }, data: { label: 'x' } } as never],
          edges: [],
        },
      }
    );

    expect(plan.nextSymbols.functions).toHaveLength(0);
    expect(plan.nextSymbols.openTabs.some((t) => t.id === func.id)).toBe(false);
    expect(plan.closeTabIds).toContain(func.id);
    expect(plan.nextDocuments[func.id]).toBeUndefined();
  });
});
