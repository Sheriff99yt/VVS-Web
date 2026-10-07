import { describe, expect, test } from 'bun:test';
import cases from '../../../tools/native_initialization_cases.json';
import { analyzeNativeInitialization } from './nativeInitialization';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';

configureNativeInventoryRuntime();
describe('independent scalar-local initialization contracts', () => {
  for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
    test(`${language}/${fixture.id}`, async () => {
      const report = await analyzeNativeInitialization(fixture.source, language);
      expect(report.reads.map(read => read.initialized)).toEqual(fixture.reads);
      expect(report.diagnostics.map(item => ({ code: item.code, status: item.status }))).toEqual(fixture.modelDiagnostic ? [{ code: `${language.toUpperCase()}_${fixture.modelDiagnostic}`, status: fixture.modelStatus }] : []);
      expect(report.graphAdmission).toBe('blocked');
      expect(report.nativeValueStatus).toBe('unvalidated');
      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.reads)).toBe(true);
      for (const read of report.reads) expect(fixture.source.slice(read.start, read.end)).toMatch(/^[A-Za-z_][A-Za-z0-9_]*$/);
      if (language === 'gdscript' && ['deferred-read', 'first-assignment', 'one-arm'].includes(fixture.id)) expect(report.declarations.some(item => item.origin === 'native-default')).toBe(true);
    });
  }
  test('calls, loops, borrowed values and unreachable source remain explicit prerequisites', async () => {
    for (const [source, language] of [
      ['int sample(int input) { int value = unknown(input); return value; }', 'cpp'],
      ['int sample() { volatile int value; value; return 0; }', 'cpp'],
      ['fn sample(input:i32)->i32 { let value=&input; return input; }', 'rust'],
      ['fn sample()->i32 { return 1; let value=2; }', 'rust'],
      ['extends RefCounted\nfunc sample()->int:\n\tvar value:int\n\twhile true:\n\t\tvalue=2\n\treturn value\n', 'gdscript'],
    ] as const) {
      const report = await analyzeNativeInitialization(source, language);
      expect(report.diagnostics.some(item => item.status === 'unsupported')).toBe(true);
      expect(report.graphAdmission).toBe('blocked');
    }
  });
});
