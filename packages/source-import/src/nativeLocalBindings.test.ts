import { expect, test } from 'bun:test';
import cases from '../../../tools/native_binding_cases.json';
import { analyzeNativeLocalBindings } from './nativeLocalBindings';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { IMPORT_LIMITS } from './contracts';

configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  test(`${language} local binding identity: ${fixture.id}`, async () => {
    const report = await analyzeNativeLocalBindings(fixture.source, language);
    expect(report.references.map(reference => report.bindings.findIndex(binding => binding.id === reference.bindingId))).toEqual(fixture.targets);
    const diagnostic = 'modelDiagnostic' in fixture ? fixture.modelDiagnostic : undefined;
    expect(report.diagnostics.map(item => item.code)).toEqual(diagnostic ? [`${language.toUpperCase()}_${diagnostic}`] : []);
    expect(report.graphAdmission).toBe('blocked'); expect(report.nativeValueStatus).toBe('unvalidated');
    for (const reference of report.references) expect(fixture.source.slice(reference.start, reference.end)).toBe(report.bindings.find(binding => binding.id === reference.bindingId)!.name);
    expect(new Set(report.bindings.map(binding => binding.id)).size).toBe(report.bindings.length);
    expect(report.bindings.every(binding => report.scopes.some(scope => scope.id === binding.scopeId && scope.bindingIds.includes(binding.id)))).toBe(true);
    expect(Object.isFrozen(report) && Object.isFrozen(report.bindings) && report.bindings.every(Object.isFrozen)).toBe(true);
    expect(report.scopes.every(scope => Object.isFrozen(scope) && Object.isFrozen(scope.bindingIds))).toBe(true);
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    expect(await analyzeNativeLocalBindings(fixture.source, language)).toEqual(report);
    if (fixture.id === 'binding-simple') expect(report.references.map(item => item.access)).toEqual(['read', 'write', 'read', 'read', 'read']);
    if (fixture.id === 'binding-readonly') expect(report.bindings.find(binding => binding.name === 'value')!.mutable).toBe(false);
  });
}

test('complex functions retain explicit unsupported binding contracts', async () => {
  const sources = {
    cpp: 'int sample(int input) { auto add = [input]() { return input; }; return add(); }',
    rust: 'pub fn sample(input:i32)->i32 { let add = || input; add() }',
    gdscript: 'extends RefCounted\nfunc sample(input:int)->int:\n\tvar add=func(): return input\n\treturn add.call()\n',
  };
  for (const language of ['cpp', 'rust', 'gdscript'] as const) {
    const report = await analyzeNativeLocalBindings(sources[language], language);
    expect(report.diagnostics.some(item => item.status === 'unsupported')).toBe(true);
    expect(report.graphAdmission).toBe('blocked');
  }
});

test('binding reports preserve method/source budgets and reject unsupported profiles', async () => {
  await expect(analyzeNativeLocalBindings(' '.repeat(IMPORT_LIMITS.sourceBytes + 1), 'rust')).rejects.toThrow('SOURCE_BUDGET');
  await expect(analyzeNativeLocalBindings(Array.from({ length: 33 }, (_, index) => `fn method${index}() {}`).join('\n'), 'rust')).rejects.toThrow('METHOD_BUDGET');
  await expect(analyzeNativeLocalBindings('', 'verse' as 'rust')).rejects.toThrow('IMPORT_LANGUAGE_UNSUPPORTED');
});
