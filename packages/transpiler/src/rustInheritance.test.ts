import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID, createClassSymbol, createVariableSymbol } from '@vvs/graph-types';
import type { GraphEdge, GraphNode, ProjectEventDefinition } from '@vvs/graph-types';
import { transpileGraph, transpileProject } from './generate';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

describe('CL-010 rust inheritance projection (composition + base.)', () => {
  test('Coverage Lab Sensor: inherited Get emits self.base.Power and maps the Get node', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
    expect(code).toContain('self.base.Power');
    expect(code).toMatch(/self\.Readings\.push\(\s*self\.base\.Power\s*\)/);
    expect(code).not.toMatch(/self\.Readings\.push\(\s*self\.Power\s*\)/);
    expect(code).toMatch(/pub fn new\(\)\s*->\s*Self/);
    expect(code).toContain('base: Machine::new()');

    const lines = code.split('\n');
    const powerLine = lines.findIndex((l) => l.includes('self.base.Power')) + 1;
    expect(powerLine).toBeGreaterThan(0);
    expect(result.sourceMap['lab-sample-power']?.some((r) => r.startLine === powerLine)).toBe(true);
  });

  test('Coverage Lab Machine: own fields stay self.Power and fn new exists', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
    expect(code).toContain('self.Power');
    expect(code).not.toContain('self.base.Power');
    expect(code).toMatch(/pub fn new\(\)\s*->\s*Self/);
    expect(code).toContain('Sensor::new()');
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

  test('transpileProject rust Coverage Lab has Sensor::new and inherited Power projection', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
    const code = result.files.find((f) => f.path.includes('CoverageLab'))?.content ?? '';
    expect(code).toContain('pub fn new() -> Self');
    expect(code).toContain('base: Machine::new()');
    expect(code).toContain('self.base.Power');
    expect(code).toContain('Sensor::new()');
  });
});
