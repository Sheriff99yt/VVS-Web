import { describe, expect, test } from 'bun:test';
import { createVariableSymbol, type VVSNodeData } from '@vvs/graph-types';
import { applyDefinePropertyToVariable, resolveVariableForNode, syncVariableNodesForSymbol } from './variableHelpers';

test('legacy variable lookup rejects ambiguous names and preserves unique matches', () => {
  const first = { ...createVariableSymbol('value'), id: 'first' }, second = { ...first, id: 'second' };
  const data: VVSNodeData = { kindId: 'variable_get', label: 'Get value', category: 'Variables', inputs: [], outputs: [], inlineValues: {}, properties: { variableName: 'value' } };
  expect(resolveVariableForNode(data, [first])).toBe(first);
  expect(resolveVariableForNode(data, [first, second])).toBeUndefined();
  const missing = JSON.parse(JSON.stringify({ ...data, graphBinding: { kind: 'variable_ref' } }));
  expect(resolveVariableForNode(missing, [first])).toBeUndefined();
  const foreign = { ...data, graphBinding: { kind: 'call_function' as const, symbolId: first.id } };
  expect(resolveVariableForNode(foreign, [first])).toBeUndefined();
});

test('synchronizing one same-name symbol preserves foreign and broken explicit bindings', () => {
  const variable = createVariableSymbol('value', { id: 'first', type: 'data_boolean' });
  const node = (id: string, symbolId: string) => ({ id, type: 'vvs_standard_node', data: { kindId: 'variable_get', label: 'Get value', category: 'Variables', inputs: [], outputs: [{ id: 'val', label: 'value', type: 'data_number' as const }], inlineValues: {}, properties: { variableName: 'value' }, graphBinding: { kind: 'variable_ref' as const, symbolId } } });
  const nodes = [node('first-ref', 'first'), node('shadow-ref', 'second'), node('missing-ref', 'missing')];
  const before = JSON.stringify(nodes);
  const next = syncVariableNodesForSymbol(nodes, variable);
  expect(next[0].data.outputs[0].type).toBe('data_boolean');
  expect(next[1]).toBe(nodes[1]); expect(next[2]).toBe(nodes[2]);
  expect(JSON.stringify(nodes)).toBe(before);
});

for (const language of ['javascript', 'python', 'csharp', 'go', 'cpp', 'rust', 'gdscript']) test(`declaration inspector resolves exact symbol identity ${language}`, () => {
  const first = { ...createVariableSymbol('value'), id: 'first' };
  const second = { ...createVariableSymbol('value'), id: 'second' };
  const data: VVSNodeData = { kindId: 'var_define', label: 'Declare value', category: 'Variables', inputs: [], outputs: [], inlineValues: {}, properties: { symbolId: second.id, variableName: 'value', nativeLocalLanguage: language } };
  expect(resolveVariableForNode(data, [first, second])).toBe(second);
  data.properties!.symbolId = 'missing';
  expect(resolveVariableForNode(data, [first, second])).toBeUndefined();
});

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
