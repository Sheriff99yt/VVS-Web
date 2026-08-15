import { describe, expect, test } from 'bun:test';
import type { GraphReference, GraphReferenceEdges } from './graphRelations';
import {
  buildReferenceTree,
  filterReferenceTreeByName,
} from './referenceTree';

function ref(from: string, to: string): GraphReference {
  return { fromGraphId: from, toGraphId: to, kind: 'calls', label: `${from}->${to}` };
}

function indexFromOutgoing(map: Record<string, string[]>): Map<string, GraphReferenceEdges> {
  const index = new Map<string, GraphReferenceEdges>();
  const ensure = (id: string): GraphReferenceEdges => {
    let edges = index.get(id);
    if (!edges) {
      edges = { incoming: [], outgoing: [] };
      index.set(id, edges);
    }
    return edges;
  };
  for (const [from, tos] of Object.entries(map)) {
    const edges = ensure(from);
    for (const to of tos) {
      const r = ref(from, to);
      edges.outgoing.push(r);
      ensure(to).incoming.push(r);
    }
  }
  return index;
}

describe('buildReferenceTree breadthLimit', () => {
  test('breadthLimit=1 with 3 outgoing peers keeps 1 child and marks truncated', () => {
    const index = indexFromOutgoing({
      root: ['a', 'b', 'c'],
    });
    const result = buildReferenceTree('root', index, 'dependencies', 2, 1);
    expect(result.tree.children).toHaveLength(1);
    expect(result.tree.children[0]?.graphId).toBe('a');
    expect(result.tree.truncated).toBe(true);
  });

  test('name filter still works with breadth', () => {
    const index = indexFromOutgoing({
      root: ['keep-me', 'other-a', 'other-b'],
    });
    const result = buildReferenceTree('root', index, 'dependencies', 2, 2);
    expect(result.tree.children.map((c) => c.graphId)).toEqual(['keep-me', 'other-a']);
    expect(result.tree.truncated).toBe(true);

    const filtered = filterReferenceTreeByName(result.tree, 'keep', (id) => id);
    expect(filtered).not.toBeNull();
    expect(filtered!.graphId).toBe('root');
    expect(filtered!.children.map((c) => c.graphId)).toEqual(['keep-me']);
  });
});
