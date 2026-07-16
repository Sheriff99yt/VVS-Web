import { describe, expect, test } from 'bun:test';
import type { VVSEdge, VVSNode } from '@/types/graph';
import { applyLayoutPositionsToNodes, layoutSelectedExecChains } from './graphChainLayout';
import { selectDownstreamFromSelection } from './graphExecChains';

function execNode(id: string, x: number, y: number): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x, y },
    width: 100,
    height: 60,
    data: {
      label: id,
      category: 'Flow',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function branchNode(id: string, x: number, y: number): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x, y },
    width: 100,
    height: 60,
    data: {
      label: id,
      category: 'Flow',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [
        { id: 'true_exec', label: 'True', type: 'execution' },
        { id: 'false_exec', label: 'False', type: 'execution' },
      ],
      inlineValues: {},
    },
  };
}

function execEdge(
  source: string,
  target: string,
  sourceHandle = 'exec_out'
): VVSEdge {
  return {
    id: `e-${source}-${sourceHandle}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle: 'exec_in',
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  };
}

describe('graphChainLayout lane-topo-v1', () => {
  test('linear chain preserves first-node (head) position', () => {
    const nodes = [
      execNode('a', 500, 300),
      execNode('b', 480, 350),
      execNode('c', 520, 280),
    ];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    const selectedIds = new Set(['a', 'b', 'c']);
    const positions = layoutSelectedExecChains({ nodes, edges, selectedIds });

    expect(positions.size).toBe(3);
    const ax = positions.get('a')!.x;
    const bx = positions.get('b')!.x;
    const cx = positions.get('c')!.x;
    expect(bx).toBeGreaterThan(ax);
    expect(cx).toBeGreaterThan(bx);

    // Head stays put; the rest straighten relative to it.
    expect(positions.get('a')!.x).toBe(500);
    expect(positions.get('a')!.y).toBe(300);
  });

  test('layout from mid-chain keeps the selected head fixed', () => {
    const nodes = [
      execNode('a', 100, 100),
      execNode('b', 250, 180),
      execNode('c', 400, 90),
    ];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    // S from B → B,C only; B is head of the layout set.
    const resolved = selectDownstreamFromSelection(new Set(['b']), nodes, edges);
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: resolved.nodeIds,
    });
    expect(positions.get('b')!.x).toBe(250);
    expect(positions.get('b')!.y).toBe(180);
    expect(positions.get('c')!.x).toBeGreaterThan(250);
  });

  test('multi-chain layout separates groups vertically without overlap', () => {
    // Two parallel chains starting at the same Y — would collide after straighten.
    const nodes = [
      execNode('a1', 100, 200),
      execNode('a2', 300, 210),
      execNode('b1', 100, 200),
      execNode('b2', 300, 205),
    ];
    const edges = [execEdge('a1', 'a2'), execEdge('b1', 'b2')];
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: new Set(['a1', 'a2', 'b1', 'b2']),
    });

    // Heads keep their X; at least one chain is shifted on Y so boxes clear.
    expect(positions.get('a1')!.x).toBe(100);
    expect(positions.get('b1')!.x).toBe(100);

    const box = (ids: string[]) => {
      let minY = Infinity;
      let maxY = -Infinity;
      for (const id of ids) {
        const p = positions.get(id)!;
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y + 60);
      }
      return { minY, maxY };
    };
    const a = box(['a1', 'a2']);
    const b = box(['b1', 'b2']);
    const separated = a.maxY + 48 <= b.minY || b.maxY + 48 <= a.minY;
    expect(separated).toBe(true);
  });

  test('layout + apply keeps parented comment members in absolute-correct places', () => {
    const commentId = 'comment-1';
    // Locked under comment at (400, 100): relative (50, 80) => absolute (450, 180)
    const a: VVSNode = {
      ...execNode('a', 50, 80),
      parentId: commentId,
      expandParent: true,
    };
    const b: VVSNode = {
      ...execNode('b', 200, 90),
      parentId: commentId,
      expandParent: true,
    };
    const comment: VVSNode = {
      id: commentId,
      type: 'vvs_comment_node',
      position: { x: 400, y: 100 },
      width: 400,
      height: 250,
      data: {
        label: 'Comment',
        category: 'Comment',
        inputs: [],
        outputs: [],
        inlineValues: {},
        properties: {
          commentLocked: true,
          commentMemberIds: ['a', 'b'],
          commentText: 'c',
        },
      },
    };
    const nodes = [comment, a, b];
    const edges = [execEdge('a', 'b')];
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: new Set(['a', 'b']),
    });
    // Absolute head stays at absolute (450, 180)
    expect(positions.get('a')!.x).toBe(450);
    expect(positions.get('a')!.y).toBe(180);
    expect(positions.get('b')!.x).toBeGreaterThan(450);

    const applied = applyLayoutPositionsToNodes(nodes, positions, new Set(['a', 'b']));
    const aNext = applied.find((n) => n.id === 'a')!;
    const bNext = applied.find((n) => n.id === 'b')!;
    const cNext = applied.find((n) => n.id === commentId)!;
    expect(aNext.parentId).toBe(commentId);
    // Relative coords: absolute - comment origin (after possible resize)
    expect(aNext.position.x + cNext.position.x).toBe(positions.get('a')!.x);
    expect(aNext.position.y + cNext.position.y).toBe(positions.get('a')!.y);
    expect(bNext.position.x + cNext.position.x).toBe(positions.get('b')!.x);
  });

  test('branch arms share a column (same layer x)', () => {
    const nodes = [
      execNode('start', 100, 100),
      branchNode('br', 200, 100),
      execNode('t', 400, 50),
      execNode('f', 400, 200),
    ];
    const edges = [
      execEdge('start', 'br'),
      execEdge('br', 't', 'true_exec'),
      execEdge('br', 'f', 'false_exec'),
    ];
    const selectedIds = new Set(['start', 'br', 't', 'f']);
    const positions = layoutSelectedExecChains({ nodes, edges, selectedIds });

    expect(positions.get('t')!.x).toBe(positions.get('f')!.x);
    expect(positions.get('t')!.y).not.toBe(positions.get('f')!.y);
    expect(positions.get('br')!.x).toBeGreaterThan(positions.get('start')!.x);
    expect(positions.get('t')!.x).toBeGreaterThan(positions.get('br')!.x);
  });

  test('empty selection returns empty map', () => {
    const positions = layoutSelectedExecChains({
      nodes: [execNode('a', 0, 0)],
      edges: [],
      selectedIds: new Set(),
    });
    expect(positions.size).toBe(0);
  });

  test('S resolve then layout covers full downstream set', () => {
    const nodes = [
      execNode('a', 10, 10),
      execNode('b', 20, 80),
      execNode('c', 30, 40),
    ];
    const edges = [execEdge('a', 'b'), execEdge('b', 'c')];
    const resolved = selectDownstreamFromSelection(new Set(['b']), nodes, edges);
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: resolved.nodeIds,
    });
    expect([...positions.keys()].sort()).toEqual(['b', 'c']);
  });

  test('branch condition sits in canopy above branch, not left into prior spine', () => {
    const cond: VVSNode = {
      id: 'cond',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      width: 100,
      height: 60,
      data: {
        label: 'cond',
        category: 'Operators',
        inputs: [],
        outputs: [{ id: 'result', label: '', type: 'data_boolean' }],
        inlineValues: {},
      },
    };
    const nodes = [
      execNode('start', 100, 200),
      branchNode('br', 300, 200),
      cond,
      execNode('t', 500, 200),
      execNode('f', 500, 320),
    ];
    const edges = [
      execEdge('start', 'br'),
      execEdge('br', 't', 'true_exec'),
      execEdge('br', 'f', 'false_exec'),
      {
        id: 'd-cond-br',
        source: 'cond',
        target: 'br',
        sourceHandle: 'result',
        targetHandle: 'condition',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_boolean' },
      } satisfies VVSEdge,
    ];
    const resolved = selectDownstreamFromSelection(new Set(['start']), nodes, edges);
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: resolved.nodeIds,
      attributeDirection: 'above',
    });

    // Canopy: above the branch, in the branch's column strip (not parked on start).
    expect(positions.get('cond')!.y).toBeLessThan(positions.get('br')!.y);
    expect(positions.get('cond')!.x).toBeGreaterThan(positions.get('start')!.x);
    // True/false arms stay at/below the spine — attributes must not steal that lane.
    expect(positions.get('cond')!.y).toBeLessThan(positions.get('t')!.y);
  });

  test('attributeDirection below hangs expression trees under the consumer', () => {
    const cond: VVSNode = {
      id: 'cond',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      width: 100,
      height: 60,
      data: {
        label: 'cond',
        category: 'Operators',
        inputs: [],
        outputs: [{ id: 'result', label: '', type: 'data_boolean' }],
        inlineValues: {},
      },
    };
    const nodes = [branchNode('br', 300, 200), cond, execNode('t', 500, 200)];
    const edges = [
      execEdge('br', 't', 'true_exec'),
      {
        id: 'd-cond-br',
        source: 'cond',
        target: 'br',
        sourceHandle: 'result',
        targetHandle: 'condition',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_boolean' },
      } satisfies VVSEdge,
    ];
    const resolved = selectDownstreamFromSelection(new Set(['br']), nodes, edges);
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: resolved.nodeIds,
      attributeDirection: 'below',
    });
    expect(positions.get('cond')!.y).toBeGreaterThan(positions.get('br')!.y);
  });

  test('below-extended fans expression nodes left in a flat stair', () => {
    const mkData = (id: string): VVSNode => ({
      id,
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      width: 100,
      height: 60,
      data: {
        label: id,
        category: 'Operators',
        inputs: [{ id: 'a', label: 'A', type: 'data_any' }],
        outputs: [{ id: 'result', label: '', type: 'data_any' }],
        inlineValues: {},
      },
    });
    const nodes = [
      execNode('pulse', 100, 100),
      execNode('print', 400, 100),
      mkData('concat'),
      mkData('toStr'),
      mkData('get'),
    ];
    const edges = [
      execEdge('pulse', 'print'),
      {
        id: 'd-concat-print',
        source: 'concat',
        target: 'print',
        sourceHandle: 'result',
        targetHandle: 'value',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_any' },
      } satisfies VVSEdge,
      {
        id: 'd-to-concat',
        source: 'toStr',
        target: 'concat',
        sourceHandle: 'result',
        targetHandle: 'a',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_any' },
      } satisfies VVSEdge,
      {
        id: 'd-get-to',
        source: 'get',
        target: 'toStr',
        sourceHandle: 'result',
        targetHandle: 'a',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_any' },
      } satisfies VVSEdge,
    ];
    const resolved = selectDownstreamFromSelection(new Set(['pulse']), nodes, edges);
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: resolved.nodeIds,
      attributeDirection: 'below-extended',
    });

    expect(positions.get('concat')!.x).toBeLessThan(positions.get('print')!.x);
    expect(positions.get('toStr')!.x).toBeLessThan(positions.get('concat')!.x);
    expect(positions.get('get')!.x).toBeLessThan(positions.get('toStr')!.x);
    expect(positions.get('concat')!.y).toBeGreaterThan(positions.get('print')!.y);
    // Edge gap between consecutive stair nodes ≈ 36px (STAIR_H_GAP).
    const toStrRight = positions.get('toStr')!.x + 100;
    const concatLeft = positions.get('concat')!.x;
    expect(concatLeft - toStrRight).toBe(36);
    const getRight = positions.get('get')!.x + 100;
    const toStrLeft = positions.get('toStr')!.x;
    expect(toStrLeft - getRight).toBe(36);
    // Spine buffer: previous exec node sits left of the child stair (not overlapping).
    const pulseW = 100;
    expect(positions.get('get')!.x).toBeGreaterThanOrEqual(
      positions.get('pulse')!.x + pulseW
    );
    // Gap before Print ≈ sum of child widths (3×100 + 2×36 + nudge/pad) — much wider than default 60.
    const spineGap =
      positions.get('print')!.x - (positions.get('pulse')!.x + pulseW);
    expect(spineGap).toBeGreaterThan(300);
  });

  test('nested expression canopy stacks upward above the branch', () => {
    const mkData = (id: string, x: number, y: number): VVSNode => ({
      id,
      type: 'vvs_standard_node',
      position: { x, y },
      width: 100,
      height: 60,
      data: {
        label: id,
        category: 'Operators',
        inputs: [{ id: 'a', label: 'A', type: 'data_any' }],
        outputs: [{ id: 'result', label: '', type: 'data_boolean' }],
        inlineValues: {},
      },
    });
    const nodes = [
      branchNode('br', 400, 300),
      mkData('and', 0, 0),
      mkData('cmp', 0, 0),
      execNode('t', 600, 300),
    ];
    const edges = [
      execEdge('br', 't', 'true_exec'),
      {
        id: 'd-and-br',
        source: 'and',
        target: 'br',
        sourceHandle: 'result',
        targetHandle: 'condition',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_boolean' },
      } satisfies VVSEdge,
      {
        id: 'd-cmp-and',
        source: 'cmp',
        target: 'and',
        sourceHandle: 'result',
        targetHandle: 'a',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_any' },
      } satisfies VVSEdge,
    ];
    const resolved = selectDownstreamFromSelection(new Set(['br']), nodes, edges);
    const positions = layoutSelectedExecChains({
      nodes,
      edges,
      selectedIds: resolved.nodeIds,
    });
    expect(positions.get('and')!.y).toBeLessThan(positions.get('br')!.y);
    expect(positions.get('cmp')!.y).toBeLessThan(positions.get('and')!.y);
  });
});
