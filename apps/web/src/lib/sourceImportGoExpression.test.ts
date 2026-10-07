import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, applyFunctionCallBinding, validateControlFlowSemantics } from '@vvs/graph-types';
import { normalizedGoSyntax } from '@vvs/source-import';
import { loadGoParser } from '../../../../packages/source-import/src/nativeParser';
import { configureGoTestRuntime } from '../../../../packages/source-import/test/goRuntime';
import fixture from '../../../../packages/source-import/test/native-go-expression.fixture.json';
import { emitProjectLikeCodePanel } from './emitProjectCode';
import { createSourceImportWorkerService } from './sourceImportWorkerService';
import type { WorkerGraphReview, WorkerReimportReview } from './sourceImportWorkerProtocol';

configureGoTestRuntime();
const source = 'package sample\nfunc check(flag bool) bool { return flag }\nfunc nested(first bool, second bool, third bool) bool { return check(first) || (check(second) && check(third)) }';

test('fixed Go expression calls preserve conditional nesting, binding refresh, source maps and reload', async () => {
  await loadGoParser();
  const snapshot = normalizeProjectSnapshot(structuredClone(fixture))!;
  const output = emitProjectLikeCodePanel(snapshot);
  expect(normalizedGoSyntax(output.files[0].content)).toBe(normalizedGoSyntax(source));
  const calls = Object.values(snapshot.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'vvs.project.call_function');
  expect(calls).toHaveLength(3);
  for (const call of calls) {
    const fn = snapshot.functions.find(fn => fn.id === call.data.graphBinding?.symbolId)!;
    call.data = applyFunctionCallBinding(call.data, fn);
    expect(call.data.properties?.callPlacement).toBe('expression');
    expect([...call.data.inputs, ...call.data.outputs].some(pin => pin.type === 'execution')).toBe(false);
    expect(output.sourceMap[call.id]?.length).toBeGreaterThan(0);
  }
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!;
  expect(emitProjectLikeCodePanel(loaded).files).toEqual(output.files);
});

for (const mutation of ['call-fanout', 'expression-fanout', 'execution-pin', 'execution-edge', 'cycle', 'disconnected-owner', 'bad-placement', 'missing-owner']) test(`fixed Go call ownership rejects saved mutation: ${mutation}`, () => {
  const changed = normalizeProjectSnapshot(structuredClone(fixture))!;
  const doc = Object.values(changed.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'vvs.project.call_function'))!;
  const call = doc.nodes.find(node => node.data.kindId === 'vvs.project.call_function')!;
  const edge = doc.edges.find(edge => edge.source === call.id)!;
  const entry = doc.nodes.find(node => node.data.kindId === 'function_entry')!;
  const returned = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
  if (mutation === 'call-fanout') doc.edges.push({ ...edge, id: 'duplicate-call-use' });
  if (mutation === 'expression-fanout') {
    const intermediate = doc.nodes.find(node => node.data.kindId === 'expr_native_operator' && node.data.properties?.operator === '&&')!;
    const use = doc.edges.find(edge => edge.source === intermediate.id)!;
    doc.edges.push({ ...use, id: 'duplicate-expression-use' });
  }
  if (mutation === 'execution-pin') call.data.inputs.unshift({ id: 'exec_in', label: '', type: 'execution' });
  if (mutation === 'execution-edge') doc.edges.push({ id: 'eager-call', source: entry.id, sourceHandle: 'exec_out', target: call.id, targetHandle: 'exec_in', data: { pinType: 'execution' } });
  if (mutation === 'cycle') { edge.target = call.id; edge.targetHandle = call.data.inputs[0].id; }
  if (mutation === 'disconnected-owner') doc.edges = doc.edges.filter(edge => edge.data?.pinType !== 'execution');
  if (mutation === 'bad-placement') call.data.properties!.callPlacement = 'cached';
  if (mutation === 'missing-owner') doc.edges = doc.edges.filter(edge => edge.source !== call.id);
  expect(validateControlFlowSemantics(changed).some(diagnostic => diagnostic.code === 'NATIVE_CALL_OWNERSHIP')).toBe(true);
  expect(() => emitProjectLikeCodePanel(changed)).toThrow();
  expect(returned.data.kindId).toBe('flow_return');
});

test('inspector placement change preserves value wiring and blocks until conditional ownership is restored', () => {
  const changed = normalizeProjectSnapshot(structuredClone(fixture))!;
  const doc = Object.values(changed.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'vvs.project.call_function'))!;
  const call = doc.nodes.filter(node => node.data.kindId === 'vvs.project.call_function')[1];
  const fn = changed.functions.find(fn => fn.id === call.data.graphBinding?.symbolId)!;
  call.data.properties!.callPlacement = 'statement';
  call.data = applyFunctionCallBinding(call.data, fn);
  expect(call.data.inputs.some(pin => pin.type === 'execution')).toBe(true);
  expect(() => emitProjectLikeCodePanel(changed)).toThrow();
  call.data.properties!.callPlacement = 'expression';
  call.data = applyFunctionCallBinding(call.data, fn);
  expect(emitProjectLikeCodePanel(changed).files[0].content).toContain('check(first) ||');
});

for (const resolution of ['keep-graph', 'use-source'] as const) test(`Go conditional-call worker reimport preserves ownership with conflict resolution: ${resolution}`, async () => {
  const worker = createSourceImportWorkerService();
  const reviewed = await worker({ id: 1, kind: 'review', language: 'go', goWordBits: 64, source, fileName: 'sample.go', mapStart: false, entryPolicy: 'library', regionIndex: 0 });
  expect(reviewed.ok).toBe(true); if (!reviewed.ok) return;
  const review = reviewed.result as WorkerGraphReview;
  expect(review.diagnostics).toEqual([]);
  const accepted = await worker({ id: 2, kind: 'accept', language: 'go', goWordBits: 64, source, fileName: 'sample.go', mapStart: false, entryPolicy: 'library', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot) });
  expect(accepted.ok).toBe(true); if (!accepted.ok) return;
  const snapshot = normalizeProjectSnapshot(accepted.result)!;
  const outer = Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'expr_native_operator' && node.data.properties?.operator === '||')!;
  outer.data.properties!.operator = '&&';
  const replacement = source.replace('return flag', 'return !flag');
  const changed = await worker({ id: 3, kind: 'review_reimport', snapshot, source: replacement, fileName: 'sample.go' });
  expect(changed.ok).toBe(true); if (!changed.ok) return;
  const next = changed.result as WorkerReimportReview;
  expect(next.diagnostics).toEqual([]);
  expect(next.conflicts).toHaveLength(1);
  const unresolved = await worker({ id: 4, kind: 'accept_reimport', snapshot, source: replacement, receipt: next.receipt });
  expect(unresolved.ok).toBe(false);
  const stale = structuredClone(snapshot);
  Object.values(stale.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'vvs.project.call_function')!.data.properties!.callPlacement = 'statement';
  const staleResult = await worker({ id: 5, kind: 'accept_reimport', snapshot: stale, source: replacement, receipt: next.receipt, resolution });
  expect(staleResult.ok).toBe(false);
  const fresh = await worker({ id: 6, kind: 'review_reimport', snapshot, source: replacement, fileName: 'sample.go' });
  expect(fresh.ok).toBe(true); if (!fresh.ok) return;
  const result = await worker({ id: 7, kind: 'accept_reimport', snapshot, source: replacement, receipt: (fresh.result as WorkerReimportReview).receipt, resolution });
  expect(result.ok).toBe(true); if (!result.ok) return;
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(result.result)))!;
  const expected = resolution === 'use-source' ? replacement : source.replace('check(first) ||', 'check(first) &&');
  expect(normalizedGoSyntax(emitProjectLikeCodePanel(loaded).files[0].content)).toBe(normalizedGoSyntax(expected));
  expect(Object.values(loaded.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'vvs.project.call_function').every(node => node.data.properties?.callPlacement === 'expression')).toBe(true);
});
