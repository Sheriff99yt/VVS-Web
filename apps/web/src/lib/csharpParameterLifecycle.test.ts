import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, analyzeProject } from '@vvs/graph-types';
import saved from '../../../../packages/transpiler/test/csharp-parameter-write.fixture.json';
import { applyFunctionUpdateToDocuments } from './symbolLifecycle';
import { spawnMenuItemKey } from './nodeCatalog';
import type { GraphDocument } from '@/types/graph';

test('C# parameter rename updates Set identity without rewriting RHSs or input pins', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(saved))!;
  const before = JSON.stringify(snapshot);
  const fn = structuredClone(snapshot.functions[0]);
  fn.overloads[0].parameters[0].label = '@Changed';
  const documents = applyFunctionUpdateToDocuments(snapshot.documents as Record<string, GraphDocument>, fn);
  const setters = documents[fn.id].nodes.filter(node => node.data.kindId === 'parameter_set');
  expect(setters).toHaveLength(4);
  for (const setter of setters) {
    expect(setter.data.graphBinding?.parameterId).toBe(fn.overloads[0].parameters[0].id);
    expect(setter.data.properties?.parameterName).toBe('@Changed');
    expect(setter.data.label).toBe('Set parameter @Changed');
  }
  expect(documents[fn.id].edges).toEqual(snapshot.documents[fn.id].edges);
  expect(analyzeProject({ ...snapshot, documents, functions: [fn] }).diagnostics.filter(issue => issue.level === 'error')).toEqual([]);
  expect(JSON.stringify(snapshot)).toBe(before);
  const deleted = structuredClone(fn); deleted.overloads[0].parameters.shift();
  const changed = applyFunctionUpdateToDocuments(documents, deleted);
  expect(analyzeProject({ ...snapshot, documents: changed, functions: [deleted] }).diagnostics.some(issue => issue.code === 'NATIVE_CSHARP_PARAMETER_OWNER')).toBe(true);
});

test('parameter spawn menu identity distinguishes slots and overloads', () => {
  const first = { type: 'parameter_set', label: 'Set first', category: 'Parameters', graphBinding: { kind: 'parameter_ref' as const, symbolId: 'fn', overloadId: 'o1', parameterId: 'first' } };
  const second = { ...first, graphBinding: { ...first.graphBinding, parameterId: 'second' } };
  expect(spawnMenuItemKey(first, 0)).not.toBe(spawnMenuItemKey(second, 1));
  expect(spawnMenuItemKey(first, 0)).not.toBe(spawnMenuItemKey({ ...first, graphBinding: { ...first.graphBinding, overloadId: 'o2' } }, 0));
});
