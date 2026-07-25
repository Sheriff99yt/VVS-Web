import { describe, expect, test } from 'bun:test';
import type { FunctionSymbol } from '@vvs/graph-types';
import {
  overloadDisplayLabel,
  overloadTreeLabel,
  appendFunctionOverload,
} from './functionTabs';

describe('functionTabs overload formatting & lifecycle', () => {
  test('overloadDisplayLabel formats parameter labels', () => {
    const emptyOverload = {
      id: 'ovl-1',
      parameters: [],
    };
    expect(overloadDisplayLabel(emptyOverload)).toBe('( )');

    const multiParamOverload = {
      id: 'ovl-2',
      parameters: [
        { id: 'p1', label: 'Width', type: 'data_number' as const },
        { id: 'p2', label: 'Height', type: 'data_number' as const },
      ],
    };
    expect(overloadDisplayLabel(multiParamOverload)).toBe('( Width, Height )');
  });

  test('overloadTreeLabel formats void, single, and multiple return parameters', () => {
    const voidOverload = {
      id: 'ovl-void',
      parameters: [],
      returnParameters: [],
      returnType: 'void' as const,
    };
    expect(overloadTreeLabel(voidOverload)).toBe('( ) → void');

    const singleReturnOverload = {
      id: 'ovl-single',
      parameters: [{ id: 'x', label: 'X', type: 'data_number' as const }],
      returnParameters: [{ id: 'ret-1', label: 'Sum', type: 'data_number' as const }],
    };
    expect(overloadTreeLabel(singleReturnOverload)).toBe('( X ) → number');

    const multiReturnOverload = {
      id: 'ovl-multi',
      parameters: [
        { id: 'a', label: 'A', type: 'data_number' as const },
        { id: 'b', label: 'B', type: 'data_number' as const },
      ],
      returnParameters: [
        { id: 'ret-1', label: 'Quotient', type: 'data_number' as const },
        { id: 'ret-2', label: 'Success', type: 'data_boolean' as const },
      ],
    };
    expect(overloadTreeLabel(multiReturnOverload)).toBe('( A, B ) → (number, boolean)');
  });

  test('appendFunctionOverload creates a new overload with graphTabId', () => {
    const fn: FunctionSymbol = {
      kind: 'function',
      id: 'fn-calc',
      name: 'Calculate',
      binding: 'instance',
      visibility: 'public',
      overloads: [
        { id: 'ovl-1', parameters: [], returnType: 'void', graphTabId: 'fn-calc' },
      ],
    };

    const result = appendFunctionOverload(fn);
    expect(result.func.overloads).toHaveLength(2);
    const added = result.func.overloads[1]!;
    expect(added.id).toBe(result.overloadId);
    expect(added.graphTabId).toBe(`fn-calc::${result.overloadId}`);
  });
});
