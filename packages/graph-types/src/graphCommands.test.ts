import { expect, test } from 'bun:test';
import { applyWireConnection, type WireConnectionAttempt } from './graphCommands';
import type { GraphNode, GraphEdge } from './nodes';
const node = (id: string): GraphNode => ({ id, type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: {
  label: id, category: 'Flow', inputs: [{ id: 'in', type: 'execution', label: '' }], outputs: [{ id: 'out', type: 'execution', label: '' }], inlineValues: {},
} });
const attempt = (source: string, target: string): WireConnectionAttempt => ({ source, target, sourceHandle: 'out', targetHandle: 'in' });
test('all host commands use the same cycle, missing pin and replacement semantics', () => {
  const nodes = ['a', 'b', 'c', 'd'].map(node);
  const first = applyWireConnection(attempt('a', 'b'), nodes, [], '1');
  if ('error' in first) throw new Error(first.error);
  expect(applyWireConnection(attempt('b', 'a'), nodes, first.edges, '2')).toEqual({ error: 'cycle' });
  expect(applyWireConnection(attempt('a', 'a'), nodes, [], '2')).toEqual({ error: 'self_connection' });
  expect(applyWireConnection({ ...attempt('a', 'b'), sourceHandle: 'missing' }, nodes, [], '2')).toEqual({ error: 'missing_pin' });
  const occupied: GraphEdge[] = [...first.edges, { id: '3', source: 'c', target: 'd', sourceHandle: 'out', targetHandle: 'in', data: { pinType: 'execution' } }];
  const rewired = applyWireConnection(attempt('a', 'd'), nodes, occupied, '4');
  if ('error' in rewired) throw new Error(rewired.error);
  expect(rewired.edges.map(edge => edge.id)).toEqual(['4']);
});
