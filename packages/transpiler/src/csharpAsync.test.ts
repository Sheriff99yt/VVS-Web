import { describe, expect, test } from 'bun:test';
import { transpileGraphCode } from './generate';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { FunctionSymbol, GraphEdge, GraphNode, PinType } from '@vvs/graph-types';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function emitAsyncMethod(name: string, returnType: PinType | 'void' = 'void'): string {
  const funcId = `fn-${name.toLowerCase()}`;
  const func: FunctionSymbol = {
    kind: 'function',
    id: funcId,
    name,
    binding: 'instance',
    visibility: 'public',
    flags: { async: true },
    classId: MAIN_CLASS_ID,
    overloads: [{ id: 'o1', parameters: [], returnType, graphTabId: funcId }],
  };
  const classNode: GraphNode = {
    id: 'class-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Class Demo',
      category: 'Project',
      kindId: 'class_define',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      properties: { symbolId: MAIN_CLASS_ID, classId: MAIN_CLASS_ID, name: 'Demo' },
    },
  };
  const fnDefine: GraphNode = {
    id: 'fn-def',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Declare ${name}`,
      category: 'Project',
      kindId: 'function_define',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      linkedGraphId: funcId,
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'o1' },
      properties: {
        symbolId: funcId,
        name,
        isAsync: true,
        graphTabId: funcId,
      },
    },
  };
  const fnImpl: GraphNode = {
    id: 'fn-impl',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Define ${name}`,
      category: 'Project',
      kindId: 'function_implement',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      linkedGraphId: funcId,
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'o1' },
      properties: { symbolId: funcId, name, graphTabId: funcId, isAsync: true },
    },
  };
  const edges: GraphEdge[] = [
    {
      id: 'e-class-def',
      source: 'class-1',
      target: 'fn-def',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
    {
      id: 'e-def-impl',
      source: 'fn-def',
      target: 'fn-impl',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
  ];
  return transpileGraphCode({
    moduleName: 'Demo',
    extendsType: '',
    targetLanguage: 'csharp',
    variables: [],
    functions: [func],
    nodes: [classNode, fnDefine, fnImpl],
    edges,
    documents: {
      [funcId]: { nodes: [], edges: [] },
    },
    projectEvents: [],
    classes: [{ kind: 'class', id: MAIN_CLASS_ID, name: 'Demo', containerId: MAIN_GRAPH_CONTAINER_ID }],
    activeClassId: MAIN_CLASS_ID,
    tabId: MAIN_GRAPH_CONTAINER_ID,
  });
}

describe('CL-006 C# async Task return type', () => {
  test('async function with void return emits async Task, not async void', () => {
    const code = emitAsyncMethod('Shutdown');
    expect(code).toContain('public async Task Shutdown()');
    expect(code).not.toContain('async void');
  });

  test('async function with a return type emits async Task<T>', () => {
    const code = emitAsyncMethod('Fetch', 'data_number');
    expect(code).toContain('public async Task<float> Fetch()');
    expect(code).not.toContain('async void');
    expect(code).not.toContain('async float');
  });
});
