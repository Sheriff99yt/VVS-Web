import { expect, test } from 'bun:test';
import { preflightExport } from './exportPreflight';
import type { GraphDocument } from '@vvs/graph-types';
const documents: Record<string, GraphDocument> = { main: { nodes: [{ id: 'input', type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { kindId: 'action_get_input', label: 'Input', category: 'Action', inputs: [], outputs: [], inlineValues: {} } }], edges: [] } };
test('a Verse placeholder blocks complete-target certification and missing evidence never passes', () => {
  const targets = [{ target: 'verse' as const, profileId: 'verse.environment-defined', profileVersion: 1, sourceMode: 'module', environment: 'none' }, { target: 'python' as const, profileId: 'python.3.11', profileVersion: 1, sourceMode: 'module', environment: 'none' }];
  const before = JSON.stringify(documents);
  const decision = preflightExport(documents, targets, []);
  expect(decision.portable).toBe(false);
  expect(decision.decisions.map(target => target.status)).toEqual(['blocked', 'unvalidated']);
  expect(decision.decisions[0].blockers[0].nodeId).toBe('input');
  expect(JSON.stringify(documents)).toBe(before);
});
