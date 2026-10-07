import { expect, test } from 'bun:test';
import { analyzeCSharpIntegralBindings } from './csharpBindings';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
import corpus from '../test/native-csharp/cases.json';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
import { CSHARP_SCOPE_CASES } from '../test/csharpScopeCases';
import { CSHARP_DEFINITE_ASSIGNMENT_PROBES } from '../test/csharpDefiniteAssignmentCases';
configureCSharpTestRuntime();

test('bindings have stable source identities and mutable values do not retain constant facts', async () => {
  const source = 'public static class Sample { public static object Test() { const int fixedValue = 1; int mutableValue = 1; var observed = fixedValue + mutableValue; return observed; } }';
  const report = await analyzeCSharpIntegralBindings(source);
  expect(report.diagnostics).toEqual([]);
  expect(report.bindings.find(binding => binding.name === 'fixedValue')?.fact.constant).toBe('1');
  expect(report.bindings.find(binding => binding.name === 'mutableValue')?.fact.constant).toBeUndefined();
  expect(report.observations.find(observation => observation.name === 'observed')?.expression.constant).toBeUndefined();
  expect((await analyzeCSharpIntegralBindings(source)).bindings.map(binding => binding.id)).toEqual(report.bindings.map(binding => binding.id));
  expect(Object.isFrozen(report)).toBe(true);
  expect(Object.isFrozen(report.bindings[0].fact)).toBe(true);
});

test('valid forms outside the binding subset are classified as unsupported', async () => {
  for (const body of ['int Local() => 1; var observed = Local(); return observed;', 'int value = 1; var observed = value++; return observed;']) {
    const report = await analyzeCSharpIntegralBindings(`public static class Sample { public static object Test() { ${body} } }`);
    expect(report.diagnostics.some(diagnostic => diagnostic.status === 'unsupported')).toBe(true);
  }
});

for (const fixture of [...corpus.cases.filter(fixture => 'integralProbe' in fixture || 'sourceBinding' in fixture), ...CSHARP_SCOPE_CASES, ...CSHARP_DEFINITE_ASSIGNMENT_PROBES]) test(`C# source bindings match native initializer: ${fixture.id}`, async () => {
  const native = evidence.observations.find(row => row.id === fixture.id)!;
  expect(native).toBeDefined();
  const result = await analyzeCSharpIntegralBindings(fixture.files[0].source);
  expect(result.analysisOnly).toBe(true);
  if ((fixture as unknown as { sourceBinding?: string }).sourceBinding === 'unsupported') {
    expect(native.ok).toBe(true);
    expect(result.diagnostics.some(diagnostic => diagnostic.status === 'unsupported')).toBe(true);
    return;
  }
  if (!native.ok) { expect(result.diagnostics.some(diagnostic => diagnostic.status === 'invalid')).toBe(true); return; }
  expect(result.diagnostics).toEqual([]);
  const observation = result.observations.find(observation => observation.name === 'observed')!;
  expect(observation).toBeDefined();
  expect(observation.expression.type).toBe(native.expressionType);
  expect(observation.converted.type).toBe(native.convertedType);
  expect(observation.declaredType).toBe(native.declaredType);
  expect(observation.expression.constant !== undefined).toBe(native.constantAvailable);
  if (observation.expression.constant !== undefined) expect(observation.expression.constant).toBe(native.constant);
  expect(observation.calls.map(call => ({ method: call.name, parameterTypes: call.parameterTypes }))).toEqual(native.calls.map(call => ({ method: call.method, parameterTypes: call.parameterTypes })));
});

test('nested scope evidence preserves lexical binding and overflow ownership without flattening', async () => {
  const source = 'class Scopes { public static int Test(int Input) { const int Outer = 1; checked { int Value = Input; unchecked { Value += Outer; } } { int Value = Input; Value = Outer; } return Input; } }';
  const report = await analyzeCSharpIntegralBindings(source);
  expect(report.diagnostics).toEqual([]);
  expect(report.scopes.map(scope => [scope.kind, scope.overflowContext])).toEqual([
    ['parameters', 'default'], ['block', 'default'], ['checked', 'checked'], ['unchecked', 'unchecked'], ['block', 'default'],
  ]);
  const values = report.bindings.filter(binding => binding.name === 'Value');
  expect(values).toHaveLength(2);
  expect(values[0].id).not.toBe(values[1].id);
  expect(values[0].scopeId).not.toBe(values[1].scopeId);
  const uncheckedScope = report.scopes.find(scope => scope.kind === 'unchecked')!;
  expect(uncheckedScope.parentScopeId).toBe(values[0].scopeId);
  const accesses = report.references.filter(reference => reference.bindingId === values[0].id);
  expect(accesses.map(reference => [reference.access, reference.overflowContext, reference.scopeId])).toEqual([
    ['read', 'unchecked', uncheckedScope.id], ['write', 'unchecked', uncheckedScope.id],
  ]);
  expect(report.references.filter(reference => reference.bindingId === values[1].id).map(reference => reference.access)).toEqual(['write']);
  for (const scope of report.scopes) {
    expect(Object.isFrozen(scope)).toBe(true);
    expect(Object.isFrozen(scope.declaredBindingIds)).toBe(true);
    expect(scope.declaredBindingIds).toEqual(report.bindings.filter(binding => binding.scopeId === scope.id).map(binding => binding.id));
  }
  expect(Object.isFrozen(report.references)).toBe(true);
  expect(report.references.every(Object.isFrozen)).toBe(true);
  const repeated = await analyzeCSharpIntegralBindings(source);
  expect(repeated.scopes).toEqual(report.scopes);
  expect(repeated.references).toEqual(report.references);
});

test('overflow expression overrides apply to reference evidence within a lexical scope', async () => {
  const report = await analyzeCSharpIntegralBindings('class Scopes { public static int Test(int Input) { checked { var observed = unchecked(Input + 1); return observed; } } }');
  expect(report.diagnostics).toEqual([]);
  const parameter = report.bindings.find(binding => binding.name === 'Input')!;
  const read = report.references.find(reference => reference.bindingId === parameter.id)!;
  expect(read.overflowContext).toBe('unchecked');
  expect(report.scopes.find(scope => scope.id === read.scopeId)?.kind).toBe('checked');
});
