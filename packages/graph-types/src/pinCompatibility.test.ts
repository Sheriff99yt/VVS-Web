import { describe, expect, test } from 'bun:test';
import { edgePinTypes, pinsAreCompatible } from './pinCompatibility';
import type { GraphNode } from './nodes';

function node(
  id: string,
  inputs: { id: string; type: 'data_number' | 'data_string' | 'data_any' | 'execution' }[],
  outputs: { id: string; type: 'data_number' | 'data_string' | 'data_any' | 'execution' }[]
): GraphNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: id,
      category: 'Test',
      inputs,
      outputs,
      inlineValues: {},
    },
  };
}

describe('pinCompatibility', () => {
  test('pinsAreCompatible allows data_any wildcard', () => {
    expect(pinsAreCompatible('data_number', 'data_any')).toBe(true);
    expect(pinsAreCompatible('data_any', 'data_string')).toBe(true);
  });

  test('pinsAreCompatible rejects mismatched concrete types', () => {
    expect(pinsAreCompatible('data_number', 'data_string')).toBe(false);
    expect(pinsAreCompatible('data_boolean', 'data_number')).toBe(false);
  });

  test('pinsAreCompatible rejects execution mixed with data', () => {
    expect(pinsAreCompatible('execution', 'data_number')).toBe(false);
    expect(pinsAreCompatible('data_number', 'execution')).toBe(false);
  });

  test('edgePinTypes rejects number to string without conversion node', () => {
    const getResult = node('get', [], [{ id: 'val', type: 'data_number' }]);
    const print = node(
      'print',
      [
        { id: 'exec_in', type: 'execution' },
        { id: 'in_str', type: 'data_string' },
      ],
      [{ id: 'exec_out', type: 'execution' }]
    );
    const types = edgePinTypes(getResult, print, 'val', 'in_str');
    expect(types).toEqual({ sourceType: 'data_number', targetType: 'data_string' });
    expect(pinsAreCompatible(types!.sourceType, types!.targetType)).toBe(false);
  });
});
