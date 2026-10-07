import { expect, test } from 'bun:test';
import { nativeRuntimeOperatorType } from './nativeRuntimeTypes';
import { NATIVE_RUNTIME_TYPE_CASES } from './nativeRuntimeTypeCases';
for (const item of NATIVE_RUNTIME_TYPE_CASES) test(`runtime scalar native types ${item.language}/${item.id}`, () => {
  const analyze = () => nativeRuntimeOperatorType(item.language, item.form, item.operator, item.operands);
  if (!item.result) expect(analyze).toThrow('NATIVE_RUNTIME_TYPE');
  else {
    const fact = analyze();
    expect(fact.nativeType).toBe(item.result);
    expect(fact.values).toBe('unknown');
    expect(fact.domain).toBe(item.result === 'bool' ? 'native-bool' : 'native-integer');
    expect(fact.evaluation).toBe(['&&', '||', 'and', 'or'].includes(item.operator) ? 'short-circuit' : 'ordinary');
    expect(Object.isFrozen(fact)).toBe(true);
  }
});
test('runtime typing refuses unknown types, arity and foreign operators', () => {
  expect(() => nativeRuntimeOperatorType('cpp', 'binary', '+', ['constructor', 'int'])).toThrow('OPERANDS');
  expect(() => nativeRuntimeOperatorType('rust', 'unary', '-', [])).toThrow('OPERANDS');
  expect(() => nativeRuntimeOperatorType('cpp', 'binary', 'and', ['bool', 'bool'])).toThrow('LOGICAL_SPELLING');
  expect(() => nativeRuntimeOperatorType('gdscript', 'binary', '??', ['int', 'int'])).toThrow('BINARY_OPERATOR');
});
