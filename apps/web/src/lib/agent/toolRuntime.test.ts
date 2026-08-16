import { describe, expect, test } from 'bun:test';
import { createEmptyProjectSnapshot } from '@vvs/graph-types';
import { LEFTOVER_UNSPAWNABLE_KINDS } from './leftoverKinds';
import { callTool, listAgentTools } from './toolRuntime';
import { parseToolCommand } from './parseToolCommand';

const LEFTOVERS = [
  'event_on_start',
  'event_on_update',
  'event_emit',
  'event_subscribe',
  'flow_sequence',
  'action_await_wait',
  'graph_ref',
] as const;

describe('in-page agent tool runtime', () => {
  test('list_available_nodes hides leftover kinds', () => {
    const snapshot = createEmptyProjectSnapshot();
    const result = callTool('list_available_nodes', {}, { snapshot, allowWrites: false });
    expect(result.ok).toBe(true);
    const nodes = (result.data as { nodes: Array<{ kindId: string }> }).nodes;
    const kindIds = nodes.map((n) => n.kindId);
    for (const leftover of LEFTOVERS) {
      expect(kindIds).not.toContain(leftover);
      expect(LEFTOVER_UNSPAWNABLE_KINDS.has(leftover)).toBe(true);
    }
    expect(kindIds).toContain('action_print');
  });

  test('add_node refuses leftover kinds even when writes are allowed', () => {
    const snapshot = createEmptyProjectSnapshot();
    for (const kindId of LEFTOVERS) {
      const result = callTool('add_node', { kind_id: kindId }, { snapshot, allowWrites: true });
      expect(result.ok).toBe(false);
      expect(result.error ?? '').toContain('unspawnable');
      expect(result.snapshot).toBeUndefined();
    }
  });

  test('get_graph and add_node operate on a fixture snapshot', () => {
    const snapshot = createEmptyProjectSnapshot();
    const before = callTool('get_graph', {}, { snapshot, allowWrites: false });
    expect(before.ok).toBe(true);
    const beforeGraph = before.data as { tabId: string; nodes: Array<{ id: string }> };
    expect(beforeGraph.tabId).toBe(snapshot.activeGraphTab);
    expect(Array.isArray(beforeGraph.nodes)).toBe(true);

    const blocked = callTool(
      'add_node',
      { kind_id: 'action_print', x: 40, y: 80 },
      { snapshot, allowWrites: false }
    );
    expect(blocked.ok).toBe(false);
    expect(blocked.error ?? '').toContain('write access is disabled');

    const added = callTool(
      'add_node',
      { kind_id: 'action_print', x: 40, y: 80 },
      { snapshot, allowWrites: true }
    );
    expect(added.ok).toBe(true);
    expect(added.snapshot).toBeDefined();
    const node = (added.data as { node: { id: string; data: { kindId: string } } }).node;
    expect(node.data.kindId).toBe('action_print');

    const after = callTool('get_graph', {}, { snapshot: added.snapshot!, allowWrites: false });
    const afterGraph = after.data as { nodes: Array<{ id: string }> };
    expect(afterGraph.nodes.some((n) => n.id === node.id)).toBe(true);
  });

  test('window-facing tool list includes the v1 runtime names', () => {
    const names = listAgentTools().map((t) => t.name);
    expect(names).toEqual([
      'list_available_nodes',
      'list_syntax_packs',
      'list_classes',
      'get_graph',
      'generate_code',
      'add_class',
      'add_node',
      'remove_node',
      'connect_pins',
    ]);
  });

  test('parseToolCommand reads /tool name json', () => {
    expect(parseToolCommand('hello')).toBeNull();
    expect(parseToolCommand('/tool list_available_nodes')).toEqual({
      name: 'list_available_nodes',
      args: {},
    });
    expect(parseToolCommand('/tool add_node {"kind_id":"action_print"}')).toEqual({
      name: 'add_node',
      args: { kind_id: 'action_print' },
    });
    const bad = parseToolCommand('/tool add_node not-json');
    expect(bad && 'error' in bad).toBe(true);
  });
});
