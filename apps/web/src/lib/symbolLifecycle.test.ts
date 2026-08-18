import { describe, expect, test } from 'bun:test';
import { createClassSymbol, createDefaultOverload, createVariableSymbol } from '@vvs/graph-types';
import type { FunctionSymbol, GraphDocument, ProjectEventDefinition, VVSNode } from '@/types/graph';
import {
  applyClassDeleteToDocuments,
  applyEventUpdateToDocuments,
  applyFunctionUpdateToDocuments,
  applyVariableRenameToDocuments,
  planSymbolDelete,
} from './symbolLifecycle';

function varDefineNode(variableId: string, name: string): VVSNode {
  return {
    id: 'var-def-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Declare ${name}`,
      category: 'Project',
      kindId: 'var_define',
      properties: { symbolId: variableId, name, default: '' },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function varGetNode(variableId: string, name: string): VVSNode {
  return {
    id: 'var-get-1',
    type: 'vvs_standard_node',
    position: { x: 80, y: 0 },
    data: {
      label: `Get ${name}`,
      category: 'Variables',
      kindId: 'variable_get',
      graphBinding: { kind: 'variable_ref', symbolId: variableId },
      properties: { variableName: name },
      inputs: [],
      outputs: [{ id: 'val', label: name, type: 'data_string' }],
      inlineValues: {},
    },
  };
}

function eventMemberNode(eventId: string, name: string): VVSNode {
  return {
    id: 'evt-mem-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Declare ${name}`,
      category: 'Events',
      kindId: 'event_member_define',
      properties: { symbolId: eventId, eventId, name, visibility: 'public' },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function eventHandlerNode(eventId: string, name: string): VVSNode {
  return {
    id: 'evt-on-1',
    type: 'vvs_standard_node',
    position: { x: 80, y: 0 },
    data: {
      label: `On ${name}`,
      category: 'Events',
      kindId: 'event_define',
      properties: { eventId, eventName: name },
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function eventDispatchNode(eventId: string, name: string): VVSNode {
  return {
    id: 'evt-call-1',
    type: 'vvs_standard_node',
    position: { x: 160, y: 0 },
    data: {
      label: `Call ${name}`,
      category: 'Events',
      kindId: 'event_dispatch',
      graphBinding: { kind: 'dispatch_event', symbolId: eventId },
      properties: { eventId, eventName: name },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

describe('applyVariableRenameToDocuments', () => {
  test('keeps var_define and rebuilds Get pins from the symbol', () => {
    const variable = createVariableSymbol('health', { id: 'var-1', type: 'data_string' });
    const documents: Record<string, GraphDocument> = {
      home: { nodes: [varDefineNode(variable.id, variable.name), varGetNode(variable.id, variable.name)], edges: [] },
    };

    const nextVar = { ...variable, name: 'hits', type: 'data_number' as const, typeRef: { kind: 'builtin' as const, id: 'data_number' as const } };
    const next = applyVariableRenameToDocuments(documents, nextVar);

    const define = next.home!.nodes.find((n) => n.id === 'var-def-1');
    expect(define?.data.kindId).toBe('var_define');
    expect(define?.data.properties?.name).toBe('hits');

    const get = next.home!.nodes.find((n) => n.id === 'var-get-1');
    expect(get?.data.kindId).toBe('variable_get');
    expect(get?.data.label).toBe('Get hits');
    expect(get?.data.outputs.map((p) => p.type)).toEqual(['data_number']);
  });
});

describe('applyEventUpdateToDocuments', () => {
  test('keeps event_member_define and rebuilds handler/dispatch pins', () => {
    const event: ProjectEventDefinition = { id: 'evt-1', name: 'pulse', parameters: [] };
    const documents: Record<string, GraphDocument> = {
      home: {
        nodes: [eventMemberNode(event.id, event.name), eventHandlerNode(event.id, event.name), eventDispatchNode(event.id, event.name)],
        edges: [],
      },
    };

    const nextEvent: ProjectEventDefinition = {
      ...event,
      name: 'tick',
      parameters: [{ id: 'amt', label: 'Amount', type: 'data_number' }],
    };
    const next = applyEventUpdateToDocuments(documents, nextEvent);

    const member = next.home!.nodes.find((n) => n.id === 'evt-mem-1');
    expect(member?.data.kindId).toBe('event_member_define');
    expect(member?.data.properties?.name).toBe('tick');
    expect(member?.data.properties?.visibility).toBe('public');

    const handler = next.home!.nodes.find((n) => n.id === 'evt-on-1');
    expect(handler?.data.kindId).toBe('event_define');
    expect(handler?.data.outputs.map((p) => p.id)).toEqual(['exec_out', 'amt']);

    const dispatch = next.home!.nodes.find((n) => n.id === 'evt-call-1');
    expect(dispatch?.data.kindId).toBe('event_dispatch');
    expect(dispatch?.data.inputs.map((p) => p.id)).toEqual(['exec_in', 'amt']);
  });
});

function functionDefineNode(funcId: string, name: string, overloadId: string, nodeId: string): VVSNode {
  return {
    id: nodeId,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Declare ${name}`,
      category: 'Project',
      kindId: 'function_define',
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId },
      properties: { symbolId: funcId, name, overloadId },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function functionImplementNode(funcId: string, name: string, overloadId: string): VVSNode {
  return {
    id: 'fn-impl-1',
    type: 'vvs_standard_node',
    position: { x: 0, y: 80 },
    data: {
      label: `Define ${name}`,
      category: 'Project',
      kindId: 'function_implement',
      graphBinding: { kind: 'call_function', symbolId: funcId, overloadId },
      properties: { symbolId: funcId, name, overloadId },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function classDefineNode(classId: string, name: string, nodeId: string): VVSNode {
  return {
    id: nodeId,
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: `Declare ${name}`,
      category: 'Project',
      kindId: 'class_define',
      properties: { symbolId: classId, classId, name },
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

describe('applyFunctionUpdateToDocuments overload define nodes', () => {
  const funcId = 'fn-1';
  const ovl1 = createDefaultOverload();
  const baseFunc: FunctionSymbol = {
    id: funcId,
    name: 'Boot',
    kind: 'function',
    classId: 'cls-1',
    binding: 'instance',
    visibility: 'public',
    overloads: [ovl1],
  };

  test('keeps function_define and function_implement kinds when renaming', () => {
    const documents: Record<string, GraphDocument> = {
      home: {
        nodes: [
          functionDefineNode(funcId, 'Boot', ovl1.id, 'fn-def-1'),
          functionImplementNode(funcId, 'Boot', ovl1.id),
        ],
        edges: [],
      },
    };
    const next = applyFunctionUpdateToDocuments(documents, { ...baseFunc, name: 'Start' });
    const define = next.home!.nodes.find((n) => n.id === 'fn-def-1');
    const impl = next.home!.nodes.find((n) => n.id === 'fn-impl-1');
    expect(define?.data.kindId).toBe('function_define');
    expect(define?.data.properties?.name).toBe('Start');
    expect(impl?.data.kindId).toBe('function_implement');
    expect(impl?.data.properties?.name).toBe('Start');
  });

  test('adds a function_define for a new overload and drops the removed one', () => {
    const documents: Record<string, GraphDocument> = {
      home: {
        nodes: [functionDefineNode(funcId, 'Boot', ovl1.id, 'fn-def-1')],
        edges: [],
      },
    };
    const ovl2 = createDefaultOverload();
    const withTwo = applyFunctionUpdateToDocuments(documents, {
      ...baseFunc,
      overloads: [ovl1, ovl2],
    });
    const defineKinds = withTwo.home!.nodes.filter((n) => n.data.kindId === 'function_define');
    expect(defineKinds).toHaveLength(2);
    const overloadIds = defineKinds.map((n) => n.data.properties?.overloadId ?? n.data.graphBinding?.overloadId);
    expect(new Set(overloadIds)).toEqual(new Set([ovl1.id, ovl2.id]));
    expect(withTwo.home!.nodes.every((n) => n.data.kindId !== 'vvs.project.call_function')).toBe(true);

    const withOne = applyFunctionUpdateToDocuments(withTwo, baseFunc);
    const remaining = withOne.home!.nodes.filter((n) => n.data.kindId === 'function_define');
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.data.properties?.overloadId ?? remaining[0]!.data.graphBinding?.overloadId).toBe(ovl1.id);
  });
});

describe('applyClassDeleteToDocuments', () => {
  test('removes that class define and member defines, leaves another class', () => {
    const gone = createClassSymbol('Gone', { id: 'cls-gone', containerId: 'home' });
    const kept = createClassSymbol('Kept', { id: 'cls-kept', containerId: 'home' });
    const variable = createVariableSymbol('hp', { id: 'var-gone', classId: gone.id });
    const func: FunctionSymbol = {
      id: 'fn-gone',
      name: 'Tick',
      kind: 'function',
      classId: gone.id,
      binding: 'instance',
      visibility: 'public',
      overloads: [createDefaultOverload()],
    };
    const event: ProjectEventDefinition = { id: 'evt-gone', name: 'pulse', classId: gone.id, parameters: [] };
    const documents: Record<string, GraphDocument> = {
      home: {
        nodes: [
          classDefineNode(gone.id, gone.name, 'class-define-cls-gone'),
          classDefineNode(kept.id, kept.name, 'class-define-cls-kept'),
          varDefineNode(variable.id, variable.name),
          functionDefineNode(func.id, func.name, func.overloads[0]!.id, 'fn-def-gone'),
          functionImplementNode(func.id, func.name, func.overloads[0]!.id),
          eventMemberNode(event.id, event.name),
        ],
        edges: [],
      },
    };

    const next = applyClassDeleteToDocuments(documents, gone, {
      variables: [variable],
      functions: [func],
      events: [event],
    });

    const kinds = next.home!.nodes.map((n) => `${n.data.kindId}:${n.data.properties?.symbolId ?? n.id}`);
    expect(next.home!.nodes.some((n) => n.id === 'class-define-cls-kept')).toBe(true);
    expect(next.home!.nodes.some((n) => n.id === 'class-define-cls-gone')).toBe(false);
    expect(next.home!.nodes.some((n) => n.data.kindId === 'var_define')).toBe(false);
    expect(next.home!.nodes.some((n) => n.data.kindId === 'function_define')).toBe(false);
    expect(next.home!.nodes.some((n) => n.data.kindId === 'function_implement')).toBe(false);
    expect(next.home!.nodes.some((n) => n.data.kindId === 'event_member_define')).toBe(false);
    expect(kinds.some((k) => k.startsWith('class_define:cls-kept'))).toBe(true);
  });
});

describe('planSymbolDelete function', () => {
  test('symbol_only removes function_define and function_implement', () => {
    const ovl = createDefaultOverload();
    const func: FunctionSymbol = {
      id: 'fn-1',
      name: 'Boot',
      kind: 'function',
      classId: 'cls-1',
      binding: 'instance',
      visibility: 'public',
      overloads: [ovl],
    };
    const other: FunctionSymbol = {
      id: 'fn-2',
      name: 'Tick',
      kind: 'function',
      classId: 'cls-1',
      binding: 'instance',
      visibility: 'public',
      overloads: [createDefaultOverload()],
    };
    const documents: Record<string, GraphDocument> = {
      home: {
        nodes: [
          functionDefineNode(func.id, func.name, ovl.id, 'fn-def-1'),
          functionImplementNode(func.id, func.name, ovl.id),
          functionDefineNode(other.id, other.name, other.overloads[0]!.id, 'fn-def-2'),
        ],
        edges: [],
      },
      [func.id]: { nodes: [], edges: [] },
    };
    const plan = planSymbolDelete(
      'function',
      func.id,
      'symbol_only',
      {
        variables: [],
        functions: [func, other],
        events: [],
        openTabs: [
          { id: func.id, type: 'function', name: func.name },
          { id: 'home', type: 'graph', name: 'Home' },
        ],
      },
      documents
    );
    expect(plan.nextSymbols.functions.map((f) => f.id)).toEqual([other.id]);
    expect(plan.nextDocuments[func.id]).toBeUndefined();
    expect(plan.closeTabIds).toContain(func.id);
    const home = plan.nextDocuments.home!;
    expect(home.nodes.some((n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === func.id)).toBe(
      false
    );
    expect(home.nodes.some((n) => n.data.kindId === 'function_implement' && n.data.properties?.symbolId === func.id)).toBe(
      false
    );
    expect(home.nodes.some((n) => n.id === 'fn-def-2')).toBe(true);
  });
});
