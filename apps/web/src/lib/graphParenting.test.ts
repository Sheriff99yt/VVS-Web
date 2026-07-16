import { describe, expect, test } from 'bun:test';
import type { VVSNode } from '@/types/graph';
import {
  detachFromParent,
  normalizeParenting,
  orderParentsBeforeChildren,
  sanitizeParentRefs,
} from './graphParenting';

function node(
  id: string,
  opts: Partial<VVSNode> & { parentId?: string } = {}
): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category: 'Test',
      inputs: [],
      outputs: [],
      inlineValues: {},
    },
    ...opts,
  } as VVSNode;
}

describe('graphParenting', () => {
  test('sanitizeParentRefs detaches orphans', () => {
    const nodes = [
      node('child', { parentId: 'missing', extent: 'parent', expandParent: true }),
      node('ok'),
    ];
    const next = sanitizeParentRefs(nodes);
    expect(next[0].parentId).toBeUndefined();
    expect(next[0].extent).toBeUndefined();
    expect(next[0].expandParent).toBeUndefined();
    expect(next[1]).toBe(nodes[1]);
  });

  test('orderParentsBeforeChildren puts parent first', () => {
    const parent = node('p', { type: 'vvs_comment_node' } as Partial<VVSNode>);
    const child = node('c', { parentId: 'p' });
    const ordered = orderParentsBeforeChildren([child, parent]);
    expect(ordered.map((n) => n.id)).toEqual(['p', 'c']);
  });

  test('normalizeParenting fixes order and orphans', () => {
    const parent = node('p');
    const orphan = node('o', { parentId: 'gone', extent: 'parent' });
    const child = node('c', { parentId: 'p' });
    const next = normalizeParenting([child, orphan, parent]);
    expect(next.map((n) => n.id)).toEqual(['p', 'c', 'o']);
    expect(next.find((n) => n.id === 'o')?.parentId).toBeUndefined();
    expect(next.find((n) => n.id === 'c')?.parentId).toBe('p');
  });

  test('detachFromParent clears extent and expandParent', () => {
    const n = detachFromParent(
      node('c', { parentId: 'p', extent: 'parent', expandParent: true, draggable: false })
    );
    expect(n.parentId).toBeUndefined();
    expect(n.extent).toBeUndefined();
    expect(n.expandParent).toBeUndefined();
    expect(n.draggable).toBeUndefined();
  });

  test('normalizeParenting strips extent parent to avoid xyflow crash', () => {
    const parent = node('p');
    const child = node('c', { parentId: 'p', extent: 'parent', expandParent: true });
    const next = normalizeParenting([child, parent]);
    expect(next.map((n) => n.id)).toEqual(['p', 'c']);
    const c = next.find((n) => n.id === 'c')!;
    expect(c.extent).toBeUndefined();
    expect(c.draggable).toBe(false);
    expect(c.expandParent).toBe(true);
  });
});
