import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID, createClassSymbol } from '@vvs/graph-types';
import type { FunctionSymbol, GraphEdge, GraphNode, ProjectEventDefinition } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function emitCallSuper(language: 'python' | 'cpp' | 'rust', isSuper: boolean): string {
  const parent = createClassSymbol('Machine', { id: 'cls-parent', containerId: MAIN_GRAPH_CONTAINER_ID });
  const child = createClassSymbol('Sensor', {
    id: 'cls-child',
    containerId: MAIN_GRAPH_CONTAINER_ID,
    extendsType: 'Machine',
  });
  const func: FunctionSymbol = {
    kind: 'function',
    id: 'fn-foo',
    name: 'Foo',
    binding: 'instance',
    visibility: 'public',
    classId: parent.id,
    overloads: [{ id: 'o1', parameters: [], returnType: 'void', graphTabId: 'fn-foo' }],
  };
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
  const callFoo: GraphNode = {
    id: 'call-foo',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Call Foo',
      category: 'Project',
      kindId: 'vvs.project.call_function',
      linkKind: 'call_function',
      linkedGraphId: func.id,
      graphBinding: { kind: 'call_function', symbolId: func.id, overloadId: 'o1' },
      properties: {
        functionId: func.id,
        functionName: 'Foo',
        isSuper,
      },
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
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
      target: 'call-foo',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
  ];
  return transpileGraphCode({
    moduleName: 'Sensor',
    extendsType: 'Machine',
    targetLanguage: language,
    variables: [],
    projectEvents: [startEvt],
    functions: [func],
    nodes: [classNode, member, onStart, callFoo],
    edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    classes: [parent, child],
    activeClassId: child.id,
  });
}

describe('Call Super is an option on Call (not a Super node)', () => {
  test('python Super Call emits super().Foo()', () => {
    const code = emitCallSuper('python', true);
    expect(code).toContain('super().Foo()');
    expect(code).not.toContain('self.Foo()');
  });

  test('python normal Call stays self.Foo()', () => {
    const code = emitCallSuper('python', false);
    expect(code).toContain('self.Foo()');
    expect(code).not.toContain('super().Foo()');
  });

  test('C++ Super Call emits Parent::Foo()', () => {
    const code = emitCallSuper('cpp', true);
    expect(code).toContain('Machine::Foo()');
    expect(code).not.toMatch(/(?<!:)Foo\(\)/);
  });

  test('Rust Super Call emits self.base.Foo() (CL-010 composition)', () => {
    const code = emitCallSuper('rust', true);
    expect(code).toContain('self.base.Foo()');
    expect(code).not.toMatch(/self\.Foo\(\)/);
  });
});
