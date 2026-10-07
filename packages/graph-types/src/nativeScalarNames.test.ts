import { expect, test } from 'bun:test';
import { NATIVE_SCALAR_KEYWORDS, validNativeScalarBindingName } from './nativeScalarNames';
import { nativeScalarFunctionSignatureProblem } from './nativeScalarSignatures';
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`${language} scalar headers reject keyword bindings`, () => {
  const signature = { language, name: 'sample', parameters: [], authoredReturnType: language === 'rust' ? '()' : 'void', nativeReturnType: language === 'rust' ? '()' : 'void' };
  for (const name of NATIVE_SCALAR_KEYWORDS[language]) {
    expect(validNativeScalarBindingName(name, language)).toBe(false);
    expect(nativeScalarFunctionSignatureProblem({ ...signature, name })).toBe('NAME');
    expect(nativeScalarFunctionSignatureProblem({ ...signature, parameters: [{ name, authoredType: 'bool', nativeType: 'bool', mutable: false }] })).toBe('PARAMETER');
  }
  for (const name of ['value', 'Value', '_value', 'Value_2']) expect(validNativeScalarBindingName(name, language)).toBe(true);
  for (const name of ['1value', 'value()', 'a b', 'r#type', 'λ']) expect(validNativeScalarBindingName(name, language)).toBe(false);
});
test('Rust2021 contextual and later-edition words remain ordinary bindings', () => {
  for (const name of ['union', 'macro_rules', 'raw', 'safe', 'gen']) expect(validNativeScalarBindingName(name, 'rust')).toBe(true);
});
test('Godot contextual words remain names; parameter/type shadowing is a header context', () => {
  for (const name of ['match', 'when', 'PI', 'bool', 'int', 'Vector2']) expect(validNativeScalarBindingName(name, 'gdscript')).toBe(true);
  const header = { language: 'gdscript' as const, name: 'sample', authoredReturnType: 'bool', nativeReturnType: 'bool', parameters: [{ name: 'bool', authoredType: 'bool', nativeType: 'bool', mutable: true }] };
  expect(nativeScalarFunctionSignatureProblem(header)).toBe('PARAMETER_TYPE_SHADOW');
  expect(nativeScalarFunctionSignatureProblem({ ...header, authoredReturnType: 'int', nativeReturnType: 'int', parameters: [{ name: 'bool', authoredType: 'int', nativeType: 'int', mutable: true }] })).toBeUndefined();
});
