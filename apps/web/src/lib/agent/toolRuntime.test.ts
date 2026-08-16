import { describe, expect, test } from 'bun:test';
import { createEmptyProjectSnapshot } from '@vvs/graph-types';
import { buildCanvasContext } from './canvasContext';
import { LEFTOVER_UNSPAWNABLE_KINDS } from './leftoverKinds';
import { callTool, listAgentTools } from './toolRuntime';
import { parseToolCommand } from './parseToolCommand';
import { formatAgentToolResult } from './transcriptFormat';

const LEFTOVERS = [
  'event_on_start',
  'event_on_update',
  'event_emit',
  'event_subscribe',
  'flow_sequence',
  'action_await_wait',
  'graph_ref',
] as const;

function entryHandler(snapshot: ReturnType<typeof createEmptyProjectSnapshot>, tabId?: string) {
  const tab = tabId ?? snapshot.activeGraphTab;
  const doc = snapshot.documents[tab];
  return doc?.nodes.find((node) => node.data.kindId === 'event_define');
}

function execEdgesFrom(snapshot: ReturnType<typeof createEmptyProjectSnapshot>, nodeId: string, tabId?: string) {
  const tab = tabId ?? snapshot.activeGraphTab;
  const doc = snapshot.documents[tab];
  return (doc?.edges ?? []).filter((edge) => edge.source === nodeId && edge.sourceHandle === 'exec_out');
}

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
      const result = callTool(
        'add_node',
        { kind_id: kindId, message: 'hello' },
        { snapshot, allowWrites: true }
      );
      expect(result.ok).toBe(false);
      expect(result.error ?? '').toContain('unspawnable');
      expect(result.snapshot).toBeUndefined();
    }
  });

  test('add_node message and inline_values set print text', () => {
    const snapshot = createEmptyProjectSnapshot();
    const viaMessage = callTool(
      'add_node',
      { kind_id: 'action_print', message: 'hello' },
      { snapshot, allowWrites: true }
    );
    expect(viaMessage.ok).toBe(true);
    const messageNode = (
      viaMessage.data as { node: { data: { inlineValues?: Record<string, unknown> } } }
    ).node;
    expect(messageNode.data.inlineValues?.in_str).toBe('hello');

    const viaInline = callTool(
      'add_node',
      { kind_id: 'action_print', inline_values: { in_str: 'from pin' } },
      { snapshot, allowWrites: true }
    );
    expect(viaInline.ok).toBe(true);
    const inlineNode = (
      viaInline.data as { node: { data: { inlineValues?: Record<string, unknown> } } }
    ).node;
    expect(inlineNode.data.inlineValues?.in_str).toBe('from pin');
  });

  test('add_node auto-wires to free On start exec_out and skips when already wired', () => {
    const snapshot = createEmptyProjectSnapshot();
    const handler = entryHandler(snapshot);
    expect(handler).toBeDefined();
    expect(execEdgesFrom(snapshot, handler!.id)).toHaveLength(0);

    const first = callTool(
      'add_node',
      { kind_id: 'action_print', message: 'hello' },
      { snapshot, allowWrites: true }
    );
    expect(first.ok).toBe(true);
    const firstNode = (first.data as { node: { id: string }; wiredFrom?: { nodeId: string } }).node;
    expect((first.data as { wiredFrom?: { nodeId: string } }).wiredFrom?.nodeId).toBe(handler!.id);
    const afterFirst = first.snapshot!;
    const firstEdges = execEdgesFrom(afterFirst, handler!.id);
    expect(firstEdges).toHaveLength(1);
    expect(firstEdges[0]?.target).toBe(firstNode.id);
    expect(firstEdges[0]?.targetHandle).toBe('exec_in');

    const second = callTool(
      'add_node',
      { kind_id: 'action_print', message: 'again' },
      { snapshot: afterFirst, allowWrites: true }
    );
    expect(second.ok).toBe(true);
    expect((second.data as { wiredFrom?: { nodeId: string } }).wiredFrom).toBeUndefined();
    const afterSecond = second.snapshot!;
    const secondNode = (second.data as { node: { id: string } }).node;
    const laterEdges = execEdgesFrom(afterSecond, handler!.id);
    expect(laterEdges).toHaveLength(1);
    expect(laterEdges[0]?.target).toBe(firstNode.id);
    expect(laterEdges.some((edge) => edge.target === secondNode.id)).toBe(false);
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

describe('canvas context builder', () => {
  test('includes active tab, language, writes, and module', () => {
    const snapshot = createEmptyProjectSnapshot();
    const off = buildCanvasContext(snapshot, { allowWrites: false });
    expect(off).toContain(`activeTab: ${snapshot.activeGraphTab}`);
    expect(off).toContain(`language: ${snapshot.targetLanguage}`);
    expect(off).toContain(`module: ${snapshot.projectDetails.moduleName}`);
    expect(off).toContain('writes: off');
    expect(off).toContain('event_define');

    const on = buildCanvasContext(snapshot, { allowWrites: true });
    expect(on).toContain('writes: on');
  });
});

describe('tool transcript formatting', () => {
  test('generate_code shows language, files, and a preview — not a raw dump', () => {
    const text = formatAgentToolResult('generate_code', {
      language: 'python',
      files: [{ path: 'untitled.py', content: 'print("hello")\n' }],
      sourceMap: {},
    });
    expect(text.startsWith('Generated python: untitled.py')).toBe(true);
    expect(text).toContain('print("hello")');
    expect(text).not.toContain('sourceMap');
  });

  test('add_node starts with a human line', () => {
    const text = formatAgentToolResult('add_node', {
      node: { id: 'node-1', data: { kindId: 'action_print' } },
      tabId: 'main-graph',
    });
    expect(text.startsWith('Added action_print (node-1) on main-graph')).toBe(true);
  });
});
