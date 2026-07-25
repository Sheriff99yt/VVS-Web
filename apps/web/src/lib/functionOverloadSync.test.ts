import { describe, expect, test } from 'bun:test';
import type { FunctionSymbol, GraphDocument, VVSNode } from '@/types/graph';
import { applyFunctionUpdateToDocuments } from './symbolLifecycle';
import { createDefaultOverload } from '@vvs/graph-types';

describe('function overload argument & return synchronization', () => {
  const funcId = 'fn-test-1';
  const overload1 = createDefaultOverload({ id: 'ovl-1' });

  const initialFunction: FunctionSymbol = {
    id: funcId,
    name: 'Calculate',
    classId: 'cls-1',
    binding: 'instance',
    visibility: 'public',
    overloads: [
      {
        ...overload1,
        parameters: [],
        returnType: 'data_number',
      },
    ],
  };

  const functionEntryNode: VVSNode = {
    id: 'entry-node-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Calculate',
      category: 'Events',
      kindId: 'function_entry',
      properties: { functionId: funcId, symbolId: funcId, name: 'Calculate' },
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'ovl-1' },
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };

  const returnNode: VVSNode = {
    id: 'return-node-1',
    type: 'vvs_standard_node',
    position: { x: 200, y: 0 },
    data: {
      label: 'Return',
      category: 'Flow Control',
      kindId: 'flow_return',
      properties: { functionId: funcId, symbolId: funcId, overloadId: 'ovl-1' },
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'ovl-1' },
      inputs: [
        { id: 'exec_in', label: '', type: 'execution' },
        { id: 'return_val', label: 'Return', type: 'data_number' },
      ],
      outputs: [],
      inlineValues: {},
    },
  };

  const callNode: VVSNode = {
    id: 'call-node-1',
    type: 'vvs_standard_node',
    position: { x: 100, y: 0 },
    data: {
      label: 'Call Calculate',
      category: 'Project',
      kindId: 'vvs.project.call_function',
      linkKind: 'call_function',
      linkedGraphId: funcId,
      properties: { functionId: funcId, functionName: 'Calculate', overloadId: 'ovl-1' },
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'ovl-1' },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [
        { id: 'exec_out', label: '', type: 'execution' },
        { id: 'return_val', label: 'Return', type: 'data_number' },
      ],
      inlineValues: {},
    },
  };

  const initialDocuments: Record<string, GraphDocument> = {
    'main': {
      nodes: [callNode],
      edges: [],
    },
    [funcId]: {
      nodes: [functionEntryNode, returnNode],
      edges: [],
    },
  };

  test('adding parameter to function overload syncs function_entry outputs and callNode inputs', () => {
    const updatedFunction: FunctionSymbol = {
      ...initialFunction,
      overloads: [
        {
          ...initialFunction.overloads[0]!,
          parameters: [
            { id: 'param-x', label: 'X', type: 'data_number' },
            { id: 'param-y', label: 'Y', type: 'data_number' },
          ],
        },
      ],
    };

    const nextDocuments = applyFunctionUpdateToDocuments(initialDocuments, updatedFunction);

    // 1. Check function_entry node on function tab graph
    const fnDoc = nextDocuments[funcId];
    expect(fnDoc).toBeDefined();
    const entry = fnDoc!.nodes.find((n) => n.data.kindId === 'function_entry');
    expect(entry).toBeDefined();
    expect(entry!.data.kindId).toBe('function_entry');
    expect(entry!.data.label).toBe('Calculate');

    // Outputs of function_entry should include exec_out + parameter pins X and Y
    const entryOutputIds = entry!.data.outputs.map((p) => p.id);
    expect(entryOutputIds).toEqual(['exec_out', 'param-x', 'param-y']);

    // 2. Check call_function node on main graph tab
    const mainDoc = nextDocuments['main'];
    expect(mainDoc).toBeDefined();
    const call = mainDoc!.nodes.find((n) => n.data.kindId === 'vvs.project.call_function');
    expect(call).toBeDefined();
    expect(call!.data.kindId).toBe('vvs.project.call_function');

    // Inputs of call node should include exec_in + parameter pins X and Y
    const callInputIds = call!.data.inputs.map((p) => p.id);
    expect(callInputIds).toEqual(['exec_in', 'param-x', 'param-y']);
  });

  test('multiple return parameters sync to flow_return inputs and callNode outputs', () => {
    const updatedFunction: FunctionSymbol = {
      ...initialFunction,
      overloads: [
        {
          ...initialFunction.overloads[0]!,
          returnParameters: [
            { id: 'ret-sum', label: 'Sum', type: 'data_number' },
            { id: 'ret-valid', label: 'IsValid', type: 'data_boolean' },
          ],
        },
      ],
    };

    const nextDocuments = applyFunctionUpdateToDocuments(initialDocuments, updatedFunction);

    // 1. Check flow_return node inputs in function graph tab
    const fnDoc = nextDocuments[funcId];
    expect(fnDoc).toBeDefined();
    const ret = fnDoc!.nodes.find((n) => n.data.kindId === 'flow_return');
    expect(ret).toBeDefined();
    expect(ret!.data.inputs.map((p) => p.id)).toEqual(['exec_in', 'ret-sum', 'ret-valid']);

    // 2. Check call_function node outputs on main graph tab
    const mainDoc = nextDocuments['main'];
    expect(mainDoc).toBeDefined();
    const call = mainDoc!.nodes.find((n) => n.data.kindId === 'vvs.project.call_function');
    expect(call).toBeDefined();
    expect(call!.data.outputs.map((p) => p.id)).toEqual(['exec_out', 'ret-sum', 'ret-valid']);
  });
});
