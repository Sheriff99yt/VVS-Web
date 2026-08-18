import { describe, expect, test } from 'bun:test';
import { createVariableSymbol } from '@vvs/graph-types';
import { applyDefinePropertyToVariable } from './variableHelpers';

describe('applyDefinePropertyToVariable', () => {
  test('maps schema default onto defaultValue', () => {
    const variable = createVariableSymbol('health', { type: 'data_number' });
    const next = applyDefinePropertyToVariable(variable, 'default', 7);
    expect(next.defaultValue).toBe(7);
    expect((next as { default?: unknown }).default).toBeUndefined();
  });

  test('maps schema type onto type + typeRef', () => {
    const variable = createVariableSymbol('flag', { type: 'data_string' });
    const next = applyDefinePropertyToVariable(variable, 'type', 'data_boolean');
    expect(next.type).toBe('data_boolean');
    expect(next.typeRef).toEqual({ kind: 'builtin', id: 'data_boolean' });
  });

  test('maps schema enumType onto enum typeRef', () => {
    const variable = createVariableSymbol('status');
    const next = applyDefinePropertyToVariable(variable, 'enumType', 'SensorStatus');
    expect(next.enumType).toBe('SensorStatus');
    expect(next.typeRef).toEqual({ kind: 'enum', name: 'SensorStatus' });
  });

  test('maps isConst onto flags.readonly', () => {
    const variable = createVariableSymbol('name');
    const next = applyDefinePropertyToVariable(variable, 'isConst', true);
    expect(next.flags?.readonly).toBe(true);
  });
});
