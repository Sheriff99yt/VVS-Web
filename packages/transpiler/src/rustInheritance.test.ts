import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID, createClassSymbol, createVariableSymbol } from '@vvs/graph-types';
import type { GraphEdge, GraphNode, ProjectEventDefinition } from '@vvs/graph-types';
import { transpileGraph, transpileProject } from './generate';
import {
  createAdvancedSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

describe('CL-010 rust inheritance projection (composition + base.)', () => {
  test('Advanced Sensor rust: composition new() and base Machine', () => {
    const snapshot = createAdvancedSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const result = transpileGraph({
      moduleName: 'Sensor',
      extendsType: 'Machine',
      targetLanguage: 'rust',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: home.nodes,
      edges: home.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: SENSOR_CLASS.id,
    });
    const code = result.files[0]!.content;
    expect(code).toMatch(/pub fn new\(\)\s*->\s*Self/);
    expect(code).toContain('base: Machine::new()');
  });

  test('Advanced Machine: own fields stay self.Label and fn new exists', () => {
    const snapshot = createAdvancedSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const result = transpileGraph({
      moduleName: 'Machine',
      extendsType: '',
      targetLanguage: 'rust',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: home.nodes,
      edges: home.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: MACHINE_CLASS.id,
    });
    const code = result.files[0]!.content;
    expect(code).toContain('self.Label');
    expect(code).not.toContain('self.base.Label');
    expect(code).toMatch(/pub fn new\(\)\s*->\s*Self/);
  });

  test('inherited Set on subclass emits self.base.Power', () => {
    const parent = createClassSymbol('Machine', { id: 'cls-parent', containerId: MAIN_GRAPH_CONTAINER_ID });
    const child = createClassSymbol('Sensor', {
      id: 'cls-child',
      containerId: MAIN_GRAPH_CONTAINER_ID,
      extendsType: 'Machine',
    });
    const power = createVariableSymbol('Power', {
      id: 'var-power',
      type: 'data_number',
      classId: parent.id,
    });
    const startEvt: ProjectEventDefinition = {
      id: 'evt-start',
      name: 'start',
      role: 'entry',
      parameters: [],
      classId: child.id,
    };
    const classNode: GraphNode = {
      id: 'class-1',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'Class Sensor',
        category: 'Project',
        kindId: 'class_define',
        inputs: [EXEC_IN],
        outputs: [EXEC_OUT],
        inlineValues: {},
        properties: {
          symbolId: child.id,
          classId: child.id,
          name: 'Sensor',
          extendsType: 'Machine',
        },
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
    const setPower: GraphNode = {
      id: 'set-power',
      type: 'vvs_standard_node',
      position: { x: 0, y: 0 },
      data: {
        label: 'Set Power',
        category: 'Variables',
        kindId: 'variable_set',
        graphBinding: { kind: 'variable_ref', symbolId: power.id },
        properties: { variableName: 'Power', symbolId: power.id },
        inputs: [EXEC_IN, { id: 'val', label: 'Value', type: 'data_number' }],
        outputs: [EXEC_OUT],
        inlineValues: { val: 1 },
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
        id: 'e-start-set',
        source: 'start-1',
        target: 'set-power',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge',
        data: { pinType: 'execution' },
      },
    ];
    const result = transpileGraph({
      moduleName: 'Sensor',
      extendsType: 'Machine',
      targetLanguage: 'rust',
      variables: [power],
      projectEvents: [startEvt],
      functions: [],
      nodes: [classNode, member, onStart, setPower],
      edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      classes: [parent, child],
      activeClassId: child.id,
    });
    const code = result.files[0]!.content;
    expect(code).toContain('self.base.Power = 1;');
    expect(code).not.toContain('self.Power = 1;');
    expect(code).toMatch(/pub fn new\(\)\s*->\s*Self/);
    expect(code).toContain('base: Machine::new()');
    const lines = code.split('\n');
    const setLine = lines.findIndex((l) => l.includes('self.base.Power = 1;')) + 1;
    expect(setLine).toBeGreaterThan(0);
    expect(result.sourceMap['set-power']?.some((r) => r.startLine === setLine)).toBe(true);
  });

  test('transpileProject rust Advanced has Sensor::new and Machine composition', () => {
    const snapshot = createAdvancedSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'rust',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
    });
    const code = result.files.find((f) => f.path.includes('Advanced'))?.content ?? '';
    expect(code).toContain('pub fn new() -> Self');
    expect(code).toContain('base: Machine::new()');
  });
});
