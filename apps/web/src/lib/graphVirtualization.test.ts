import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  EMPTY_SEARCH_NODES,
  GRAPH_ONLY_RENDER_VISIBLE,
  GRAPH_VIRTUALIZATION_CANVAS_SOURCES,
  GRAPH_VIRTUALIZATION_NODE_TARGET,
  estimateMountedNodeBudget,
  isPinWired,
  nodesForSearchSubscription,
  shouldPreferViewportCulling,
  type PinWireEdge,
} from './graphVirtualization';

const APPS_WEB_SRC = join(import.meta.dir, '..');

const SAMPLE_EDGES: PinWireEdge[] = [
  { source: 'a', target: 'b', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
  { source: 'b', target: 'c', sourceHandle: 'then', targetHandle: 'exec-in' },
  { source: 'x', target: 'y', sourceHandle: 'value', targetHandle: 'in0' },
];

describe('graphVirtualization constants', () => {
  test('keeps viewport culling enabled as the U83 baseline', () => {
    expect(GRAPH_ONLY_RENDER_VISIBLE).toBe(true);
  });

  test('documents the 500+ node scale target', () => {
    expect(GRAPH_VIRTUALIZATION_NODE_TARGET).toBeGreaterThanOrEqual(500);
  });

  test('lists edit + reference canvases that must opt into culling', () => {
    expect(GRAPH_VIRTUALIZATION_CANVAS_SOURCES).toContain('components/graph/GraphCanvas.tsx');
    expect(GRAPH_VIRTUALIZATION_CANVAS_SOURCES).toContain(
      'components/views/ReferenceGraphCanvas.tsx'
    );
  });
});

describe('graphVirtualization canvas wiring', () => {
  test('each listed canvas source passes GRAPH_ONLY_RENDER_VISIBLE', () => {
    for (const rel of GRAPH_VIRTUALIZATION_CANVAS_SOURCES) {
      const source = readFileSync(join(APPS_WEB_SRC, rel), 'utf8');
      expect(source).toContain("from '@/lib/graphVirtualization'");
      expect(source).toContain('onlyRenderVisibleElements={GRAPH_ONLY_RENDER_VISIBLE}');
    }
  });
});

describe('isPinWired', () => {
  test('detects input pin wiring by target + handle', () => {
    expect(isPinWired(SAMPLE_EDGES, 'b', 'exec-in', 'input')).toBe(true);
    expect(isPinWired(SAMPLE_EDGES, 'b', 'missing', 'input')).toBe(false);
    expect(isPinWired(SAMPLE_EDGES, 'a', 'exec-in', 'input')).toBe(false);
  });

  test('detects output pin wiring by source + handle', () => {
    expect(isPinWired(SAMPLE_EDGES, 'a', 'exec-out', 'output')).toBe(true);
    expect(isPinWired(SAMPLE_EDGES, 'a', 'then', 'output')).toBe(false);
    expect(isPinWired(SAMPLE_EDGES, 'b', 'then', 'output')).toBe(true);
  });

  test('ignores edges that touch the node on the wrong direction', () => {
    expect(isPinWired(SAMPLE_EDGES, 'b', 'exec-out', 'output')).toBe(false);
    expect(isPinWired(SAMPLE_EDGES, 'a', 'exec-in', 'input')).toBe(false);
  });

  test('treats null handles as non-matches for labeled pins', () => {
    const edges: PinWireEdge[] = [
      { source: 'a', target: 'b', sourceHandle: null, targetHandle: null },
    ];
    expect(isPinWired(edges, 'b', 'exec-in', 'input')).toBe(false);
    expect(isPinWired(edges, 'a', 'exec-out', 'output')).toBe(false);
  });

  test('returns false for empty ids or empty edge lists', () => {
    expect(isPinWired([], 'a', 'exec-out', 'output')).toBe(false);
    expect(isPinWired(SAMPLE_EDGES, '', 'exec-out', 'output')).toBe(false);
    expect(isPinWired(SAMPLE_EDGES, 'a', '', 'output')).toBe(false);
  });

  test('scales over a large edge list without changing semantics', () => {
    const many: PinWireEdge[] = Array.from({ length: 2000 }, (_, i) => ({
      source: `n${i}`,
      target: `n${i + 1}`,
      sourceHandle: 'out',
      targetHandle: 'in',
    }));
    many.push({ source: 'hot', target: 'sink', sourceHandle: 'value', targetHandle: 'in0' });
    expect(isPinWired(many, 'sink', 'in0', 'input')).toBe(true);
    expect(isPinWired(many, 'hot', 'value', 'output')).toBe(true);
    expect(isPinWired(many, 'missing', 'in0', 'input')).toBe(false);
  });
});

describe('nodesForSearchSubscription', () => {
  test('returns the stable empty sentinel while collapsed', () => {
    const nodes = [{ id: '1' }, { id: '2' }];
    const a = nodesForSearchSubscription(false, nodes);
    const b = nodesForSearchSubscription(false, nodes);
    expect(a).toBe(EMPTY_SEARCH_NODES);
    expect(b).toBe(EMPTY_SEARCH_NODES);
    expect(a).toBe(b);
  });

  test('returns the live node list while expanded', () => {
    const nodes = [{ id: '1' }, { id: '2' }];
    expect(nodesForSearchSubscription(true, nodes)).toBe(nodes);
  });

  test('collapsed subscription ignores node-list identity churn', () => {
    const first = nodesForSearchSubscription(false, [{ id: 'a' }]);
    const second = nodesForSearchSubscription(false, [{ id: 'b' }, { id: 'c' }]);
    expect(first).toBe(second);
  });
});

describe('estimateMountedNodeBudget / shouldPreferViewportCulling', () => {
  test('caps mounted budget at total nodes', () => {
    expect(estimateMountedNodeBudget(10, 100, 8)).toBe(10);
  });

  test('adds overscan above visible count', () => {
    expect(estimateMountedNodeBudget(500, 40, 8)).toBe(48);
  });

  test('handles empty / negative visible counts', () => {
    expect(estimateMountedNodeBudget(0, 0)).toBe(0);
    expect(estimateMountedNodeBudget(100, -1)).toBe(0);
  });

  test('prefers culling only at the large-graph threshold with sparse viewport', () => {
    expect(shouldPreferViewportCulling(100, 20)).toBe(false);
    expect(shouldPreferViewportCulling(500, 40)).toBe(true);
    expect(shouldPreferViewportCulling(500, 500)).toBe(false);
  });

  test('at target scale, culled budget stays well below full mount', () => {
    const total = GRAPH_VIRTUALIZATION_NODE_TARGET;
    const visible = 60;
    const mounted = estimateMountedNodeBudget(total, visible);
    expect(mounted).toBeLessThan(total);
    expect(mounted / total).toBeLessThan(0.25);
  });
});
