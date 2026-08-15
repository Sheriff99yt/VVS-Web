import { describe, expect, test } from 'bun:test';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { GraphEdge, GraphNode, ProjectEventDefinition } from '@vvs/graph-types';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

describe('node leftovers (wait pin, On role, declare spawn emit)', () => {
  test('wired Wait seconds emits the source expression', () => {
    const getDuration: GraphNode = {
      id: 'get-dur',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'Get Duration',
        category: 'Variables',
        kindId: 'variable_get',
        graphBinding: { kind: 'variable_ref', symbolId: 'var-dur' },
        properties: { variableName: 'Duration' },
        inputs: [],
        outputs: [{ id: 'val', label: 'Duration', type: 'data_number' }],
        inlineValues: {},
      },
    };
    const wait: GraphNode = {
      id: 'wait-1',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'Wait',
        category: 'Action',
        kindId: 'action_wait',
        inputs: [EXEC_IN, { id: 'seconds', label: 'Seconds', type: 'data_number' }],
        outputs: [EXEC_OUT],
        inlineValues: {},
        properties: {},
      },
    };
    const edges: GraphEdge[] = [
      {
        id: 'e-dur',
        source: 'get-dur',
        target: 'wait-1',
        sourceHandle: 'val',
        targetHandle: 'seconds',
        type: 'vvs_standard_edge',
        data: { pinType: 'data_number' },
      },
    ];
    const code = transpileGraphCode(
      withTestEntryGraph({
        moduleName: 'Demo',
        extendsType: '',
        targetLanguage: 'python',
        variables: [{ id: 'var-dur', name: 'Duration', type: 'data_number' }],
        functions: [],
        nodes: [getDuration, wait],
        edges,
      })
    );
    expect(code).toContain('time.sleep(');
    expect(code).toMatch(/time\.sleep\(\s*self\.Duration\s*\)/);
    expect(code).not.toContain('time.sleep(1)');
  });

  test('On role tick emits on_update even when the symbol role is custom', () => {
    const tickEvent: ProjectEventDefinition = {
      id: 'evt-tick',
      name: 'frame',
      role: 'custom',
      parameters: [],
      classId: MAIN_CLASS_ID,
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
    const member: GraphNode = {
      id: 'tick-member',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'Declare frame',
        category: 'Events',
        kindId: 'event_member_define',
        inputs: [EXEC_IN],
        outputs: [EXEC_OUT],
        inlineValues: {},
        properties: { symbolId: tickEvent.id, eventId: tickEvent.id, name: 'frame' },
      },
    };
    const onTick: GraphNode = {
      id: 'on-tick',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'On frame',
        category: 'Events',
        kindId: 'event_define',
        inputs: [],
        outputs: [EXEC_OUT],
        inlineValues: {},
        properties: { eventId: tickEvent.id, eventName: 'frame', symbolId: tickEvent.id, role: 'tick' },
      },
    };
    const print: GraphNode = {
      id: 'print-1',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'Print String',
        category: 'Action',
        kindId: 'action_print',
        inputs: [EXEC_IN, { id: 'in_str', label: 'String', type: 'data_string' }],
        outputs: [EXEC_OUT],
        inlineValues: { in_str: 'tick' },
        properties: {},
      },
    };
    const code = transpileGraphCode({
      moduleName: 'Demo',
      extendsType: '',
      targetLanguage: 'python',
      variables: [],
      functions: [],
      nodes: [classNode, member, onTick, print],
      edges: [
        {
          id: 'e-class-member',
          source: 'class-1',
          target: 'tick-member',
          sourceHandle: 'exec_out',
          targetHandle: 'exec_in',
          type: 'vvs_standard_edge',
          data: { pinType: 'execution' },
        },
        {
          id: 'e-on-print',
          source: 'on-tick',
          target: 'print-1',
          sourceHandle: 'exec_out',
          targetHandle: 'exec_in',
          type: 'vvs_standard_edge',
          data: { pinType: 'execution' },
        },
      ],
      projectEvents: [tickEvent],
      classes: [{ kind: 'class', id: MAIN_CLASS_ID, name: 'Demo', containerId: MAIN_GRAPH_CONTAINER_ID }],
      activeClassId: MAIN_CLASS_ID,
      tabId: MAIN_GRAPH_CONTAINER_ID,
    });
    expect(code).toContain('def on_update(self):');
    expect(code).not.toContain('def on_frame(self):');
  });
});
