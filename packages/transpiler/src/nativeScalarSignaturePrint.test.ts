import { expect, test } from 'bun:test';
import { NATIVE_SCALAR_SIGNATURE_TYPES, type NativeScalarFunctionSignature } from '@vvs/graph-types';
import { printNativeScalarFunctionHeader, printNativeScalarParameter } from './print/nativeScalarSignature';
import { renderFunctionDefHeader } from './emit/shell';
import type { FunctionSymbol } from '@vvs/graph-types';

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const type of NATIVE_SCALAR_SIGNATURE_TYPES[language]) test(`scalar signature print ${language}/${type}`, () => {
  const signature: NativeScalarFunctionSignature = { name: 'sample', language, parameters: [{ name: 'value', authoredType: type, nativeType: type, mutable: language !== 'rust' }], authoredReturnType: type, nativeReturnType: type };
  const output = printNativeScalarFunctionHeader(JSON.parse(JSON.stringify(signature)), 'define');
  const expected = language === 'cpp' ? `${type} sample(${type} value) {` : language === 'rust' ? `fn sample(value: ${type}) -> ${type} {` : `func sample(value: ${type}) -> ${type}:`;
  expect(output.text).toBe(expected);
  expect(output.spans).toEqual([{ nodeId: 'define', start: 0, end: expected.length }]);
  const symbol = { kind: 'function', id: 'sample', name: 'sample', binding: 'module', overloads: [] } as FunctionSymbol;
  expect(renderFunctionDefHeader(symbol, language, false, { nativeSignatureLanguage: language, nativeParameters: signature.parameters, nativeAuthoredReturnType: type, nativeReturnType: type })).toBe(expected);
});

test('authored native qualifiers, aliases, modifiers and unit spelling remain visible', () => {
  expect(printNativeScalarParameter({ name: 'value', authoredType: 'unsigned', nativeType: 'unsigned int', mutable: false }, 'cpp')).toBe('const unsigned value');
  expect(printNativeScalarParameter({ name: 'value', authoredType: 'i8', nativeType: 'i8', mutable: true }, 'rust')).toBe('mut value: i8');
  const unit: NativeScalarFunctionSignature = { name: 'sample', language: 'rust', parameters: [], authoredReturnType: '()', nativeReturnType: '()' };
  expect(printNativeScalarFunctionHeader(unit, 'define', { modifiers: ['pub', 'const'] }).text).toBe('pub const fn sample() {');
  expect(printNativeScalarFunctionHeader(unit, 'define', { explicitUnitReturn: true }).text).toBe('fn sample() -> () {');
  expect(() => printNativeScalarFunctionHeader(unit, 'define', { modifiers: ['async'] })).toThrow('MODIFIERS');
  expect(() => printNativeScalarFunctionHeader(unit, '')).toThrow('OWNER');
});

test('native header renderer rejects unreviewed roles, modifiers and hidden defaults', () => {
  const symbol = { kind: 'function', id: 'sample', name: 'sample', binding: 'module', overloads: [] } as FunctionSymbol;
  const properties = { nativeSignatureLanguage: 'rust', nativeParameters: [], nativeAuthoredReturnType: '()', nativeReturnType: '()' };
  for (const extra of [{ isAsync: true }, { isVirtual: true }, { isOverride: true }, { isAbstract: true }, { role: 'constructor' }]) expect(() => renderFunctionDefHeader(symbol, 'rust', false, { ...properties, ...extra })).toThrow('CONTEXT');
  expect(() => renderFunctionDefHeader({ ...symbol, binding: 'instance' }, 'rust', false, properties)).toThrow('CONTEXT');
  expect(() => renderFunctionDefHeader(symbol, 'rust', false, { ...properties, nativeParameters: [{ name: 'value', nativeType: 'i8', authoredType: 'i8', mutable: false, defaultExpression: {} }] })).toThrow('PARAMETERS');
});
