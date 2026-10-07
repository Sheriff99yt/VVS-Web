import { expect, test } from 'bun:test';
import { analyzeCSharpIntegralBindings } from './csharpBindings';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
import { CSHARP_BRANCH_CASES } from '../test/csharpBranchCases';
import { csharpBooleanProbes, evaluateCSharpBooleanProbe } from '../test/csharpBooleanProbes';
import { CSharpIntegerError } from '@vvs/graph-types';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
import { reviewCSharpImportGraph } from './validation';
configureCSharpTestRuntime();

for (const fixture of CSHARP_BRANCH_CASES) test(`native branch source analysis: ${fixture.id}`, async () => {
  const native = evidence.observations.find(row => row.id === fixture.id)!;
  expect(native).toBeDefined(); expect(native.ok).toBe(fixture.expected.ok);
  const report = await analyzeCSharpIntegralBindings(fixture.files[0].source);
  if ('unresolvedInvalid' in fixture) { expect(report.diagnostics.some(diagnostic => diagnostic.status === 'unsupported')).toBe(true); return; }
  if (!native.ok) { expect(report.diagnostics.some(diagnostic => diagnostic.status === 'invalid')).toBe(true); return; }
  expect(report.diagnostics).toEqual([]);
  const observation = report.observations.find(row => row.name === 'observed');
  if (observation) {
    expect(observation.expression.type).toBe(native.expressionType);
    expect(observation.expression.constant !== undefined).toBe(native.constantAvailable);
  }
});
for (const fixture of csharpBooleanProbes()) test(`predefined Boolean contract: ${fixture.id}`, () => {
  const native = evidence.observations.find(row => row.id === fixture.id)!;
  expect(native).toBeDefined();
  if (!native.ok) { expect(() => evaluateCSharpBooleanProbe(fixture.booleanProbe)).toThrow(CSharpIntegerError); return; }
  const fact = evaluateCSharpBooleanProbe(fixture.booleanProbe);
  expect(fact.type).toBe(native.expressionType);
  expect(fact.constant !== undefined).toBe(native.constantAvailable);
  if (fact.constant !== undefined) expect(fact.constant ? 'true' : 'false').toBe(native.constant);
});
test('branch environments isolate siblings, intersect live exits and retain immutable statement evidence', async () => {
  const fixture = CSHARP_BRANCH_CASES.find(row => row.id === 'source-branch-both-assign')!;
  const report = await analyzeCSharpIntegralBindings(fixture.files[0].source);
  const value = report.bindings.find(binding => binding.name === 'Value')!;
  const branch = report.flow.find(flow => flow.kind === 'if_statement')!;
  expect(branch.entryAssignedBindingIds).not.toContain(value.id);
  expect(branch.exitAssignedBindingIds).toContain(value.id);
  const writes = report.flow.filter(flow => flow.kind === 'expression_statement');
  expect(writes).toHaveLength(2);
  for (const write of writes) {
    expect(write.entryAssignedBindingIds).not.toContain(value.id);
    expect(write.exitAssignedBindingIds).toContain(value.id);
  }
  expect(branch.condition?.type).toBe('bool'); expect(branch.condition?.constant).toBeUndefined();
  expect(Object.isFrozen(report.flow)).toBe(true);
  for (const flow of report.flow) {
    expect(Object.isFrozen(flow)).toBe(true); expect(Object.isFrozen(flow.entryAssignedBindingIds)).toBe(true); expect(Object.isFrozen(flow.exitAssignedBindingIds)).toBe(true);
  }
  expect((await analyzeCSharpIntegralBindings(fixture.files[0].source)).flow).toEqual(report.flow);
});
test('a returned branch contributes no assignment path and a dead tail remains represented', async () => {
  const source = 'class Paths { static int Test(int Input) { int Value; if (Input > 0) return Input; else Value = Input; var observed = Value; return observed; int Dead; Dead++; } }';
  const report = await analyzeCSharpIntegralBindings(source);
  expect(report.diagnostics).toEqual([]);
  const value = report.bindings.find(binding => binding.name === 'Value')!;
  expect(report.flow.find(flow => flow.kind === 'if_statement')?.exitAssignedBindingIds).toContain(value.id);
  const dead = report.flow.filter(flow => flow.reachable === false);
  expect(dead).toHaveLength(2);
  expect(dead.every(flow => flow.endReachable === false)).toBe(true);
  expect(report.references.some(reference => reference.access === 'write' && reference.bindingId === report.bindings.find(binding => binding.name === 'Dead')?.id)).toBe(true);
});
test('native branch evidence does not bypass the separate visible graph admission gate', async () => {
  const fixture = CSHARP_BRANCH_CASES.find(row => row.id === 'source-branch-both-assign')!;
  expect((await analyzeCSharpIntegralBindings(fixture.files[0].source)).diagnostics).toEqual([]);
  const review = await reviewCSharpImportGraph(fixture.files[0].source, 'Branches.cs');
  expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0);
});
