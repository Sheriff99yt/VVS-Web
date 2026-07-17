import { describe, expect, test } from 'bun:test';
import type { VVSEdge, VVSNode } from '@/types/graph';
import { autoConnectTwoNodes, findBestAutoConnect } from './graphAutoConnect';

function execNode(id: string, x: number): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x, y: 0 },
    data: {
      label: id,
      category: 'Action',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function dataNode(
  id: string,
  x: number,
  outs: { id: string; type: 'data_string' | 'data_number' }[],
  inns: { id: string; type: 'data_string' | 'data_number' }[]
): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x, y: 40 },
    data: {
      label: id,
      category: 'Math',
      inputs: inns.map((p) => ({ ...p, label: p.id })),
      outputs: outs.map((p) => ({ ...p, label: p.id })),
      inlineValues: {},
    },
  };
}

describe('graphAutoConnect', () => {
  test('connects left→right execution between two nodes', () => {
    const a = execNode('a', 0);
    const b = execNode('b', 200);
    const best = findBestAutoConnect(a, b, [], [a, b]);
    expect(best).not.toBeNull();
    expect(best!.connection.source).toBe('a');
    expect(best!.connection.target).toBe('b');
    expect(best!.pinType).toBe('execution');
  });

  test('autoConnectTwoNodes applies a wire', () => {
    const a = execNode('a', 0);
    const b = execNode('b', 200);
    const result = autoConnectTwoNodes([a, b], [a, b], []);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.edges).toHaveLength(1);
      expect(result.edge.source).toBe('a');
      expect(result.edge.target).toBe('b');
    }
  });

  test('prefers compatible data pins when no exec', () => {
    const a = dataNode('src', 0, [{ id: 'out', type: 'data_string' }], []);
    const b = dataNode('dst', 200, [], [{ id: 'in', type: 'data_string' }]);
    const best = findBestAutoConnect(a, b, [], [a, b]);
    expect(best?.connection.source).toBe('src');
    expect(best?.connection.target).toBe('dst');
  });

  test('returns need_two_nodes for wrong selection size', () => {
    const a = execNode('a', 0);
    expect(autoConnectTwoNodes([a], [a], []).ok).toBe(false);
  });

  test('skips already-wired pair', () => {
    const a = execNode('a', 0);
    const b = execNode('b', 200);
    const edges: VVSEdge[] = [
      {
        id: 'e1',
        source: 'a',
        target: 'b',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' },
      },
    ];
    expect(findBestAutoConnect(a, b, edges, [a, b])).toBeNull();
  });
});
