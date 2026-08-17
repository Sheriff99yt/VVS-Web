import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID, createClassSymbol } from '@vvs/graph-types';
import type { FunctionSymbol, GraphEdge, GraphNode, ProjectEventDefinition } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function emitOverloadedCall(language: 'python' | 'cpp', overloadId: string): string {
  const cls = createClassSymbol('Machine', { id: 'cls-main', containerId: MAIN_GRAPH_CONTAINER_ID });
  const func: FunctionSymbol = {
    kind: 'function',
    id: 'fn-ping',
    name: 'Ping',
    binding: 'instance',
    visibility: 'public',
    classId: cls.id,
    overloads: [
      {
        id: 'ovr_a',
        parameters: [{ id: 'alpha', label: 'alpha', type: 'data_string' }],
        returnType: 'void',
        graphTabId: 'fn-ping-a',
      },
      {
        id: 'ovr_b',
        parameters: [
          { id: 'beta', label: 'beta', type: 'data_string' },
          { id: 'count', label: 'count', type: 'data_number' },
        ],
        returnType: 'void',
        graphTabId: 'fn-ping-b',
      },
    ],
  };
  const startEvt: ProjectEventDefinition = {
    id: 'evt-start',
    name: 'start',
    role: 'entry',
    parameters: [],
    classId: cls.id,
  };
  const classNode: GraphNode = {
    id: 'class-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Class Machine',
      category: 'Project',
      kindId: 'class_define',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      properties: { symbolId: cls.id, classId: cls.id, name: 'Machine' },
    },
  };
  const member: GraphNode = {
    id: 'entry-member',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Declare start',
      category: 'Events',
      kindId: 'event_member_define',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
      properties: { symbolId: startEvt.id, eventId: startEvt.id, name: 'start' },
    },
  };
  const onStart: GraphNode = {
    id: 'start-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'On start',
      category: 'Events',
      kindId: 'event_define',
      inputs: [],
      outputs: [EXEC_OUT],
      inlineValues: {},
      properties: { eventId: startEvt.id, eventName: 'start', symbolId: startEvt.id },
    },
  };
  const callPing: GraphNode = {
    id: 'call-ping',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Call Ping',
      category: 'Project',
      kindId: 'vvs.project.call_function',
      linkKind: 'call_function',
      linkedGraphId: func.id,
      graphBinding: { kind: 'call_function', symbolId: func.id, overloadId },
      properties: {
        functionId: func.id,
        functionName: 'Ping',
        overloadId,
      },
      // Leftover overload-A pin plus B pins — emit must use the selected overload only.
      inputs: [
        EXEC_IN,
        { id: 'alpha', label: 'alpha', type: 'data_string' },
        { id: 'beta', label: 'beta', type: 'data_string' },
        { id: 'count', label: 'count', type: 'data_number' },
      ],
      outputs: [EXEC_OUT],
      inlineValues: { alpha: 'AAA', beta: 'BBB', count: 2 },
    },
  };
  const edges: GraphEdge[] = [
    {
      id: 'e-class-member',
      source: 'class-1',
      target: 'entry-member',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
    {
      id: 'e-start-call',
      source: 'start-1',
      target: 'call-ping',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
  ];
  return transpileGraphCode({
    moduleName: 'Machine',
    extendsType: '',
    targetLanguage: language,
    variables: [],
    projectEvents: [startEvt],
    functions: [func],
    nodes: [classNode, member, onStart, callPing],
    edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    classes: [cls],
    activeClassId: cls.id,
  });
}

describe('overload call-site emit', () => {
  test('Call that picks overload B emits B args only', () => {
    const code = emitOverloadedCall('python', 'ovr_b');
    expect(code).toContain('Ping(');
    expect(code).toContain('BBB');
    expect(code).toContain('2');
    expect(code).not.toContain('AAA');
  });

  test('Call that picks overload A emits A args only', () => {
    const code = emitOverloadedCall('python', 'ovr_a');
    expect(code).toContain('AAA');
    expect(code).not.toContain('BBB');
  });
});
