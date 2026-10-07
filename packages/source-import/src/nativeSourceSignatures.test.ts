import { expect, test } from 'bun:test';
import cases from '../../../tools/native_signature_cases.json';
import { analyzeNativeSourceSignatures } from './nativeSourceSignatures';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
configureNativeInventoryRuntime();

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) test(`source signature ${language}/${fixture.id}`, async () => {
  const report = await analyzeNativeSourceSignatures(fixture.source, language);
  expect(report.graphAdmission).toBe('blocked');
  expect(report.inventory.regions.map(item => item.text).join('')).toBe(fixture.source);
  if ('unsupported' in fixture && fixture.unsupported) {
    expect(report.signatures).toHaveLength(0);
    expect(report.diagnostics).toHaveLength(1);
  } else {
    expect(report.diagnostics).toHaveLength(0);
    expect(report.signatures).toHaveLength(1);
    const signature = report.signatures[0];
    expect(signature.name).toBe('sample');
    expect(fixture.source.slice(signature.nameSpan.start, signature.nameSpan.end)).toBe('sample');
    expect(signature.nativeReturnType).toBe(fixture.returnType);
    expect(signature.parameters.map(item => ({ name: item.name, type: item.nativeType, mutable: item.mutable }))).toEqual(fixture.parameters);
    for (const parameter of signature.parameters) {
      expect(fixture.source.slice(parameter.start, parameter.end)).toBe(parameter.name);
      expect(fixture.source.slice(parameter.typeSpan.start, parameter.typeSpan.end)).toBe(parameter.authoredType);
      expect(Object.isFrozen(parameter)).toBe(true);
    }
    expect(Object.isFrozen(signature)).toBe(true);
    expect(Object.isFrozen(signature.parameters)).toBe(true);
  }
});

test('ordinary source headers exclude nested closures and retain unresolved source', async () => {
  const report = await analyzeNativeSourceSignatures('fn sample()->i32 { let nested=|x:i32|->i32{x}; nested(1) }', 'rust');
  expect(report.signatures).toHaveLength(1);
  expect(report.signatures[0].parameters).toHaveLength(0);
  expect(report.graphAdmission).toBe('blocked');
  expect(report.inventory.regions.every(item => ['unresolved', 'trivia'].includes(item.kind))).toBe(true);
});
