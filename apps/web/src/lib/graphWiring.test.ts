import { describe, expect, test } from 'bun:test';
import type { VVSEdge, VVSNode } from '@/types/graph';
import { applyWireConnection } from './graphWiring';

function execNode(id: string, label: string): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label,
      category: 'Flow',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function execEdge(source: string, target: string, id?: string): VVSEdge {
  return {
    id: id ?? `e-${source}-${target}`,
    source,
    target,
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  };
}

describe('applyWireConnection flow semantics', () => {
  test('rewiring into the middle of a chain drops the previous upstream link', () => {
    const nodes = [execNode('a', 'A'), execNode('b', 'B'), execNode('c', 'C'), execNode('x', 'X')];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];

    const result = applyWireConnection(
      { source: 'x', target: 'b', sourceHandle: 'exec_out', targetHandle: 'exec_in' },
      nodes,
      edges
    );

    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.edges).toHaveLength(2);
    expect(result.edges.some((e) => e.source === 'a' && e.target === 'b')).toBe(false);
    expect(result.edges.some((e) => e.source === 'x' && e.target === 'b')).toBe(true);
    expect(result.edges.some((e) => e.source === 'b' && e.target === 'c')).toBe(true);
  });

  test('rewiring flow out replaces the previous downstream link', () => {
    const nodes = [execNode('a', 'A'), execNode('b', 'B'), execNode('d', 'D')];
    const edges = [execEdge('a', 'b')];

    const result = applyWireConnection(
      { source: 'b', target: 'd', sourceHandle: 'exec_out', targetHandle: 'exec_in' },
      nodes,
      edges
    );

    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.edges.filter((e) => e.source === 'b')).toHaveLength(1);
    expect(result.edges.some((e) => e.source === 'b' && e.target === 'd')).toBe(true);
  });
});
