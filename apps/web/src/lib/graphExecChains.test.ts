import { describe, expect, test } from 'bun:test';
import type { VVSEdge, VVSNode } from '@/types/graph';
import {
  buildExecAdjacency,
  expandToFullChains,
  selectDownstreamFromSelection,
  selectExecRangeBetween,
  nodesOnDirectedExecPaths,
  shortestUndirectedExecPath,
} from './graphExecChains';

function execNode(id: string): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category: 'Flow',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function branchNode(id: string): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category: 'Flow',
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'condition', label: 'Condition', type: 'data_boolean' },
      ],
      outputs: [
        { id: 'true_exec', label: 'True', type: 'execution' },
        { id: 'false_exec', label: 'False', type: 'execution' },
      ],
      inlineValues: {},
    },
  };
}

function dataNode(id: string): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category: 'Operators',
      inputs: [{ id: 'a', label: 'A', type: 'data_any' }],
      outputs: [{ id: 'result', label: '', type: 'data_boolean' }],
      inlineValues: {},
    },
  };
}

function execEdge(
  source: string,
  target: string,
  sourceHandle = 'exec_out',
  targetHandle = 'exec_in'
): VVSEdge {
  return {
    id: `e-${source}-${sourceHandle}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  };
}

function dataEdge(
  source: string,
  target: string,
  sourceHandle = 'result',
  targetHandle = 'condition'
): VVSEdge {
  return {
    id: `d-${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'vvs_standard_edge',
    data: { pinType: 'data_boolean' },
  };
}

function ids(result: { nodeIds: Set<string> }): string[] {
  return [...result.nodeIds].sort();
}

describe('graphExecChains', () => {
  test('linear A→B→C: select B → S selects B,C only (not upstream A)', () => {
    const nodes = [execNode('a'), execNode('b'), execNode('c')];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    const result = selectDownstreamFromSelection(new Set(['b']), nodes, edges);
    expect(ids(result)).toEqual(['b', 'c']);
  });

  test('linear: select only C → S selects C only', () => {
    const nodes = [execNode('a'), execNode('b'), execNode('c')];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    const result = selectDownstreamFromSelection(new Set(['c']), nodes, edges);
    expect(ids(result)).toEqual(['c']);
  });

  test('linear: select B → A expands to full chain including upstream', () => {
    const nodes = [execNode('a'), execNode('b'), execNode('c')];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    const result = expandToFullChains(new Set(['b']), nodes, edges);
    expect(ids(result)).toEqual(['a', 'b', 'c']);
  });

  test('branch: select Branch → S includes both arms, not upstream start', () => {
    const nodes = [
      execNode('start'),
      branchNode('br'),
      execNode('t'),
      execNode('f'),
    ];
    const edges = [
      execEdge('start', 'br'),
      execEdge('br', 't', 'true_exec'),
      execEdge('br', 'f', 'false_exec'),
    ];
    const result = selectDownstreamFromSelection(new Set(['br']), nodes, edges);
    expect(ids(result)).toEqual(['br', 'f', 't']);
  });

  test('branch condition attribute is pulled into S', () => {
    const nodes = [
      execNode('start'),
      branchNode('br'),
      dataNode('cond'),
      execNode('t'),
    ];
    const edges = [
      execEdge('start', 'br'),
      execEdge('br', 't', 'true_exec'),
      dataEdge('cond', 'br'),
    ];
    const result = selectDownstreamFromSelection(new Set(['br']), nodes, edges);
    expect(ids(result)).toEqual(['br', 'cond', 't']);
  });

  test('nested data expression tree is pulled into S', () => {
    const nodes = [
      branchNode('br'),
      dataNode('and'),
      dataNode('cmp'),
      execNode('t'),
    ];
    const edges = [
      execEdge('br', 't', 'true_exec'),
      dataEdge('and', 'br'),
      dataEdge('cmp', 'and', 'result', 'a'),
    ];
    const result = selectDownstreamFromSelection(new Set(['br']), nodes, edges);
    expect(ids(result)).toEqual(['and', 'br', 'cmp', 't']);
  });

  test('parented children are included', () => {
    const parent = execNode('parent');
    const child: VVSNode = {
      ...execNode('child'),
      parentId: 'parent',
    };
    const result = selectDownstreamFromSelection(new Set(['parent']), [parent, child], []);
    expect(ids(result)).toEqual(['child', 'parent']);
  });

  test('two disjoint chains: multi-select expands only those chains', () => {
    const nodes = [
      execNode('a1'),
      execNode('a2'),
      execNode('b1'),
      execNode('b2'),
      execNode('orphan'),
    ];
    const edges = [execEdge('a1', 'a2'), execEdge('b1', 'b2')];
    const s = selectDownstreamFromSelection(new Set(['a2', 'b1']), nodes, edges);
    expect(ids(s)).toEqual(['a2', 'b1', 'b2']);
    const a = expandToFullChains(new Set(['a2', 'b1']), nodes, edges);
    expect(ids(a)).toEqual(['a1', 'a2', 'b1', 'b2']);
  });

  test('data wire alone does not create exec connectivity for A', () => {
    const nodes = [execNode('a'), execNode('b'), dataNode('c')];
    const edges = [execEdge('a', 'b'), dataEdge('c', 'b', 'result', 'exec_in')];
    // c feeds b via a mis-typed data edge in this fixture — A on b still only
    // expands exec component a-b, then pulls c as attribute of b.
    const result = expandToFullChains(new Set(['b']), nodes, edges);
    expect(ids(result)).toEqual(['a', 'b', 'c']);
  });

  test('empty selection → empty', () => {
    const nodes = [execNode('a')];
    expect(ids(selectDownstreamFromSelection(new Set(), nodes, []))).toEqual([]);
    expect(ids(expandToFullChains(new Set(), nodes, []))).toEqual([]);
  });

  test('Shift range: linear chain selects nodes in between', () => {
    const nodes = [execNode('a'), execNode('b'), execNode('c'), execNode('d')];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c'), execEdge('c', 'd')];
    expect(ids(selectExecRangeBetween('a', 'd', nodes, edges))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(selectExecRangeBetween('d', 'b', nodes, edges))).toEqual(['b', 'c', 'd']);
  });

  test('Shift range: branch selects all nodes on paths between ends', () => {
    const nodes = [
      execNode('start'),
      branchNode('br'),
      execNode('t'),
      execNode('f'),
      dataNode('cond'),
    ];
    const edges = [
      execEdge('start', 'br'),
      {
        id: 'e-t',
        source: 'br',
        target: 't',
        sourceHandle: 'true_exec',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' as const },
      },
      {
        id: 'e-f',
        source: 'br',
        target: 'f',
        sourceHandle: 'false_exec',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' as const },
      },
      dataEdge('cond', 'br', 'result', 'condition'),
    ];
    expect(ids(selectExecRangeBetween('start', 't', nodes, edges))).toEqual([
      'br',
      'cond',
      'start',
      't',
    ]);
    // Sibling arms: undirected path through branch
    expect(ids(selectExecRangeBetween('t', 'f', nodes, edges))).toEqual(['br', 'cond', 'f', 't']);
  });

  test('Shift range: disconnected nodes → empty', () => {
    const nodes = [execNode('a'), execNode('b'), execNode('x')];
    const edges = [execEdge('a', 'b')];
    expect(ids(selectExecRangeBetween('a', 'x', nodes, edges))).toEqual([]);
    expect(shortestUndirectedExecPath('a', 'x', buildExecAdjacency(edges))).toBeNull();
    expect(nodesOnDirectedExecPaths('a', 'b', buildExecAdjacency(edges))).toEqual(
      new Set(['a', 'b'])
    );
  });

  test('Shift range: from data attribute child to downstream exec', () => {
    const nodes = [
      execNode('start'),
      branchNode('br'),
      execNode('t'),
      dataNode('cond'),
    ];
    const edges = [
      execEdge('start', 'br'),
      {
        id: 'e-t',
        source: 'br',
        target: 't',
        sourceHandle: 'true_exec',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' as const },
      },
      dataEdge('cond', 'br', 'result', 'condition'),
    ];
    expect(ids(selectExecRangeBetween('cond', 't', nodes, edges))).toEqual([
      'br',
      'cond',
      't',
    ]);
    expect(ids(selectExecRangeBetween('t', 'cond', nodes, edges))).toEqual([
      'br',
      'cond',
      't',
    ]);
  });

  test('Shift range: from nested expression child through chain', () => {
    const nodes = [
      execNode('a'),
      execNode('b'),
      execNode('c'),
      dataNode('inner'),
      dataNode('outer'),
    ];
    const edges = [
      execEdge('a', 'b'),
      execEdge('b', 'c'),
      dataEdge('inner', 'outer'),
      dataEdge('outer', 'b', 'result', 'exec_in'),
    ];
    // Mis-typed data into exec_in still treats outer→b as data host resolve.
    expect(ids(selectExecRangeBetween('inner', 'c', nodes, edges))).toEqual([
      'b',
      'c',
      'inner',
      'outer',
    ]);
  });

  test('Shift range: from parented child of an exec node', () => {
    const child: VVSNode = {
      ...dataNode('child'),
      parentId: 'b',
    };
    const nodes = [execNode('a'), execNode('b'), execNode('c'), child];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    expect(ids(selectExecRangeBetween('child', 'c', nodes, edges))).toEqual([
      'b',
      'c',
      'child',
    ]);
  });

  test('buildExecAdjacency only uses execution pins', () => {
    const edges = [execEdge('a', 'b'), dataEdge('b', 'c')];
    const g = buildExecAdjacency(edges);
    expect(g.forward.get('a')).toEqual(['b']);
    expect(g.forward.has('b')).toBe(false);
  });
});
