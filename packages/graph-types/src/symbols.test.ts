import { describe, expect, test } from 'bun:test';
import {
  createDefaultOverload,
  overloadReturnParameters,
  type FunctionOverload,
} from './symbols';

describe('overloadReturnParameters helper', () => {
  test('returns returnParameters array when present and non-empty', () => {
    const overload: FunctionOverload = {
      id: 'ovl-1',
      parameters: [],
      returnParameters: [
        { id: 'ret-1', label: 'Result', type: 'data_number' },
        { id: 'ret-2', label: 'Success', type: 'data_boolean' },
      ],
    };

    const returns = overloadReturnParameters(overload);
    expect(returns).toEqual([
      { id: 'ret-1', label: 'Result', type: 'data_number' },
      { id: 'ret-2', label: 'Success', type: 'data_boolean' },
    ]);
  });

  test('falls back to single returnType when returnParameters is undefined', () => {
    const overload: FunctionOverload = {
      id: 'ovl-legacy',
      parameters: [],
      returnType: 'data_string',
    };

    const returns = overloadReturnParameters(overload);
    expect(returns).toEqual([
      { id: 'return_val', label: 'Return', type: 'data_string' },
    ]);
  });

  test('returns empty array when returnType is void and returnParameters is undefined', () => {
    const overload: FunctionOverload = {
      id: 'ovl-void',
      parameters: [],
      returnType: 'void',
    };

    const returns = overloadReturnParameters(overload);
    expect(returns).toEqual([]);
  });

  test('returns empty array when returnParameters is explicitly empty []', () => {
    const overload: FunctionOverload = {
      id: 'ovl-empty',
      parameters: [],
      returnParameters: [],
      returnType: 'void',
    };

    const returns = overloadReturnParameters(overload);
    expect(returns).toEqual([]);
  });

  test('createDefaultOverload initializes returnParameters as empty array', () => {
    const overload = createDefaultOverload();
    expect(overload.returnParameters).toEqual([]);
    expect(overloadReturnParameters(overload)).toEqual([]);
  });
});
