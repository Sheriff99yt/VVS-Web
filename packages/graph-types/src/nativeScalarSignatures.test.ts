import { expect, test } from 'bun:test';
import { canonicalNativeScalarSignatureType, nativeScalarFunctionSignatureProblem, nativeScalarSignaturePin, NATIVE_SCALAR_SIGNATURE_TYPES, type NativeScalarFunctionSignature } from './nativeScalarSignatures';

test('shared scalar signature identities and ports preserve native types', () => {
  for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const type of NATIVE_SCALAR_SIGNATURE_TYPES[language]) {
    expect(canonicalNativeScalarSignatureType(type, language)).toBe(type);
    expect(nativeScalarSignaturePin(type, language)).toBe(type === 'bool' ? 'data_boolean' : 'data_number');
  }
  expect(canonicalNativeScalarSignatureType('unsigned long long int', 'cpp')).toBe('unsigned long long');
  for (const type of ['int*', '&i32', 'Vec<i32>', 'Variant', 'someCall()', 'float']) for (const language of ['cpp', 'rust', 'gdscript'] as const) expect(canonicalNativeScalarSignatureType(type, language)).toBeUndefined();
});

test('entry and constructor names cannot acquire an ordinary-function role', () => {
  for (const [language, name, type] of [['cpp', 'main', 'int'], ['gdscript', '_init', 'void']] as const) {
    expect(nativeScalarFunctionSignatureProblem({ language, name, parameters: [], nativeReturnType: type, authoredReturnType: type })).toBe('FUNCTION_ROLE_CONTEXT');
  }
  expect(nativeScalarFunctionSignatureProblem({ language: 'rust', name: 'main', parameters: [], nativeReturnType: 'bool', authoredReturnType: 'bool' })).toBeUndefined();
});

test('saved scalar header mutations cannot replace authored semantic identity', () => {
  const signature: NativeScalarFunctionSignature = { name: 'sample', language: 'rust', authoredReturnType: 'i8', nativeReturnType: 'i8', parameters: [{ name: 'value', authoredType: 'i8', nativeType: 'i8', mutable: false }] };
  expect(nativeScalarFunctionSignatureProblem(signature)).toBeUndefined();
  const copy = () => JSON.parse(JSON.stringify(signature)) as NativeScalarFunctionSignature;
  for (const mutate of [
    (value: any) => { value.nativeReturnType = 'i32'; },
    (value: any) => { value.parameters[0].nativeType = 'u8'; },
    (value: any) => { value.parameters.push({ ...value.parameters[0] }); },
    (value: any) => { value.parameters[0].mutable = 'false'; },
    (value: any) => { value.parameters[0].authoredType = 'call()'; },
  ]) { const edited = copy(); mutate(edited); expect(nativeScalarFunctionSignatureProblem(edited)).toBeDefined(); }
});

test('missing native types and inherited object keys cannot acquire signature identity', () => {
  expect(canonicalNativeScalarSignatureType('__proto__', 'cpp')).toBeUndefined();
  expect(canonicalNativeScalarSignatureType('constructor', 'cpp')).toBeUndefined();
  const malformed = { language: 'rust', name: 'sample', parameters: [{ name: 'value', mutable: false }], authoredReturnType: '()', nativeReturnType: '()' };
  expect(nativeScalarFunctionSignatureProblem(malformed as unknown as NativeScalarFunctionSignature)).toBe('PARAMETER_TYPE');
  const noReturnType = { language: 'rust', name: 'sample', parameters: [] };
  expect(nativeScalarFunctionSignatureProblem(noReturnType as unknown as NativeScalarFunctionSignature)).toBe('RETURN_TYPE');
  const noName = { ...noReturnType, authoredReturnType: '()', nativeReturnType: '()' };
  delete (noName as { name?: string }).name;
  expect(nativeScalarFunctionSignatureProblem(noName as unknown as NativeScalarFunctionSignature)).toBe('NAME');
});
