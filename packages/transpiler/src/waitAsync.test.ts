import { describe, expect, test } from 'bun:test';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { FunctionSymbol, GraphEdge, GraphNode } from '@vvs/graph-types';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function waitNode(id: string, isAsync?: boolean): GraphNode {
  return {
    id,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Wait',
      category: 'Action',
      kindId: 'action_wait',
      inputs: [EXEC_IN, { id: 'seconds', label: 'Seconds', type: 'data_number' }],
      outputs: [EXEC_OUT],
      inlineValues: { seconds: 2 },
      properties: isAsync === undefined ? {} : { isAsync },
    },
  };
}

function emitWait(
  language: 'python' | 'javascript' | 'csharp' | 'cpp' | 'rust' | 'go' | 'verse' | 'gdscript',
  isAsync?: boolean
): string {
  return transpileGraphCode(
    withTestEntryGraph({
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: language,
      variables: [],
      functions: [],
      nodes: [waitNode('wait-1', isAsync)],
      edges: [],
    })
  );
}

describe('U101 Wait async option', () => {
  test('python sync Wait emits time.sleep and import time', () => {
    const code = emitWait('python', false);
    expect(code).toContain('import time');
    expect(code).toContain('time.sleep(2)');
    expect(code).not.toContain('asyncio.sleep');
  });

  test('python Wait.isAsync emits await asyncio.sleep and import asyncio', () => {
    const code = emitWait('python', true);
    expect(code).toContain('import asyncio');
    expect(code).toContain('await asyncio.sleep(2)');
    expect(code).not.toContain('time.sleep');
  });

  test('javascript sync Wait emits a busy-wait, not a stub comment', () => {
    const code = emitWait('javascript', false);
    expect(code).toContain('Date.now()');
    expect(code).not.toContain('blocking wait');
    expect(code).not.toContain('await new Promise');
    expect(code).not.toContain('setTimeout');
  });

  test('javascript Wait.isAsync emits await new Promise setTimeout', () => {
    const code = emitWait('javascript', true);
    expect(code).toContain('await new Promise((resolve) => setTimeout(resolve, 2 * 1000));');
  });

  test('csharp sync Wait emits Thread.Sleep and using System.Threading', () => {
    const code = emitWait('csharp', false);
    expect(code).toContain('using System.Threading;');
    expect(code).toContain('Thread.Sleep((int)(2 * 1000));');
    expect(code).not.toContain('Task.Delay');
  });

  test('csharp Wait.isAsync emits await Task.Delay and using System.Threading.Tasks', () => {
    const code = emitWait('csharp', true);
    expect(code).toContain('using System.Threading.Tasks;');
    expect(code).toContain('await Task.Delay((int)(2 * 1000));');
  });

  test('python Wait follows enclosing function async flag', () => {
    const funcId = 'fn-go';
    const func: FunctionSymbol = {
      kind: 'function',
      id: funcId,
      name: 'Go',
      binding: 'instance',
      visibility: 'public',
      flags: { async: true },
      classId: MAIN_CLASS_ID,
      overloads: [{ id: 'o1', parameters: [], returnType: 'void', graphTabId: funcId }],
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
        label: 'Declare Go',
        category: 'Project',
        kindId: 'function_define',
        inputs: [EXEC_IN],
        outputs: [EXEC_OUT],
        inlineValues: {},
        linkedGraphId: funcId,
        graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'o1' },
        properties: {
          symbolId: funcId,
          name: 'Go',
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
        label: 'Define Go',
        category: 'Project',
        kindId: 'function_implement',
        inputs: [EXEC_IN],
        outputs: [EXEC_OUT],
        inlineValues: {},
        linkedGraphId: funcId,
        graphBinding: { kind: 'call_function', symbolId: funcId, overloadId: 'o1' },
        properties: { symbolId: funcId, name: 'Go', graphTabId: funcId },
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
    const code = transpileGraphCode({
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: 'python',
      variables: [],
      functions: [func],
      nodes: [classNode, fnDefine, fnImpl],
      edges,
      documents: {
        [funcId]: { nodes: [waitNode('wait-fn')], edges: [] },
      },
      projectEvents: [],
      classes: [{ kind: 'class', id: MAIN_CLASS_ID, name: 'Demo', containerId: MAIN_GRAPH_CONTAINER_ID }],
      activeClassId: MAIN_CLASS_ID,
      tabId: MAIN_GRAPH_CONTAINER_ID,
    });
    expect(code).toContain('async def Go');
    expect(code).toContain('import asyncio');
    expect(code).toContain('await asyncio.sleep(2)');
    expect(code).not.toContain('time.sleep');
  });

  test('C++ Wait.isAsync emits the same thread sleep — no fake # async', () => {
    const sync = emitWait('cpp', false);
    const asyncWait = emitWait('cpp', true);
    expect(asyncWait).toContain('std::this_thread::sleep_for');
    expect(asyncWait).not.toContain('# async');
    expect(asyncWait).not.toContain('co_await');
    expect(asyncWait).toContain('std::this_thread::sleep_for');
    expect(sync).toContain('std::this_thread::sleep_for');
  });

  test('Rust Wait.isAsync emits the same thread sleep — no Tokio, no fake # async', () => {
    const asyncWait = emitWait('rust', true);
    expect(asyncWait).toContain('std::thread::sleep');
    expect(asyncWait).not.toContain('tokio');
    expect(asyncWait).not.toContain('# async');
    expect(asyncWait).not.toContain('await ');
  });

  test('Go Wait.isAsync emits the same time.Sleep — no async keyword', () => {
    const asyncWait = emitWait('go', true);
    expect(asyncWait).toContain('time.Sleep');
    expect(asyncWait).not.toContain('# async');
    expect(asyncWait).not.toMatch(/\basync\b/);
  });

  test('python Wait.isAsync does not flip the enclosing function to async', () => {
    const code = emitWait('python', true);
    expect(code).toContain('await asyncio.sleep(2)');
    expect(code).not.toMatch(/async def on_start/);
  });

});
