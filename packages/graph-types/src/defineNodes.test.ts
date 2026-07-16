import { describe, expect, it } from 'vitest';
import {
  collectMemberDefineNodeIds,
  findDefineNodesForSymbol,
  findMemberChainHead,
  findMemberChainTail,
  findClassDefineNode,
  classDefineMatchesClass,
  classRequiresClassDefine,
} from './defineNodes';
import { createClassSymbol, MAIN_GRAPH_CONTAINER_ID } from './symbols';
import type { GraphDocument } from './symbols';

function edge(source: string, target: string) {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    type: 'vvs_wire_edge',
    data: { pinType: 'execution' as const },
  };
}

function varDefineNode(id: string, symbolId: string) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: `Define ${symbolId}`,
      category: 'Variables',
      kindId: 'var_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: { symbolId },
    },
  };
}

function eventDefineNode(id: string, symbolId: string, y: number) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y },
    data: {
      label: `Declare ${symbolId}`,
      category: 'Events',
      kindId: 'event_member_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: { symbolId },
    },
  };
}

function functionDefineNode(id: string, symbolId: string, y = 0) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y },
    data: {
      label: `Declare ${symbolId}`,
      category: 'Functions',
      kindId: 'function_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: { symbolId },
    },
  };
}

describe('defineNodes', () => {
  it('collects ordered member define nodes along exec chain', () => {
    const doc: GraphDocument = {
      nodes: [
        {
          id: 'class',
          type: 'vvs_standard_node',
          position: { x: 0, y: 0 },
          data: {
            label: 'Class Calculator',
            category: 'Project',
            kindId: 'class_define',
            inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
            outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
            inlineValues: {},
          },
        },
        varDefineNode('v1', 'var-a'),
        varDefineNode('v2', 'var-b'),
      ],
      edges: [edge('class', 'v1'), edge('v1', 'v2')],
    };

    const mockVars = [
      { id: 'var-a', name: 'v1', classId: 'main-class' } as any,
      { id: 'var-b', name: 'v2', classId: 'main-class' } as any,
    ];
    expect(collectMemberDefineNodeIds(doc, undefined, mockVars, [], [])).toEqual(['class', 'v1', 'v2']);
    expect(findMemberChainHead(doc)?.id).toBe('class');
    expect(findMemberChainTail(doc)?.id).toBe('v2');
    expect(findDefineNodesForSymbol(doc, 'variable', 'var-a')).toHaveLength(1);
  });

  it('findClassDefineNode matches symbolId and legacy unbound define', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });

    const boundDoc: GraphDocument = {
      nodes: [
        {
          id: 'class-define-main-class',
          type: 'vvs_standard_node',
          position: { x: 0, y: 0 },
          data: {
            label: 'Declare Calc',
            category: 'Project',
            kindId: 'class_define',
            inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
            outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
            inlineValues: {},
            properties: { symbolId: cls.id, classId: cls.id },
          },
        },
      ],
      edges: [],
    };
    expect(findClassDefineNode(boundDoc, cls)?.id).toBe('class-define-main-class');

    const legacyDoc: GraphDocument = {
      nodes: [
        {
          id: 'legacy-class',
          type: 'vvs_standard_node',
          position: { x: 0, y: 0 },
          data: {
            label: 'Class Calc',
            category: 'Project',
            kindId: 'class_define',
            inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
            outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
            inlineValues: {},
            properties: { name: 'Calc' },
          },
        },
      ],
      edges: [],
    };
    expect(classDefineMatchesClass(legacyDoc.nodes[0]!, cls, legacyDoc)).toBe(true);
    expect(findClassDefineNode(legacyDoc, cls)?.id).toBe('legacy-class');
  });

  it('classRequiresClassDefine is true only when member define chain exists', () => {
    expect(classRequiresClassDefine(undefined)).toBe(false);
    expect(classRequiresClassDefine({ nodes: [], edges: [] })).toBe(false);
    expect(
      classRequiresClassDefine({
        nodes: [
          {
            id: 'vd',
            type: 'vvs_standard_node',
            position: { x: 0, y: 0 },
            data: { kindId: 'var_define', label: 'Declare x', category: 'Variables' },
          },
        ],
        edges: [],
      })
    ).toBe(true);
  });

  it('orders event defines by canvas Y even when chained event→event', () => {
    const classNode = {
      id: 'class',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'Declare Machine',
        category: 'Project',
        kindId: 'class_define',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: {},
        properties: { symbolId: 'main-class' },
      },
    };
    const mockFns = [{ id: 'fn-boot', name: 'Boot', classId: 'main-class' } as any];
    const mockEvts = [
      { id: 'evt-start', name: 'start', classId: 'main-class' } as any,
      { id: 'evt-pulse', name: 'pulse', classId: 'main-class' } as any,
    ];

    // Linear chain (typical dual-write) but pulse is visually higher → pulse first.
    const pulseHigher: GraphDocument = {
      nodes: [
        classNode,
        functionDefineNode('fn', 'fn-boot', 0),
        eventDefineNode('evt-start', 'evt-start', 100),
        eventDefineNode('evt-pulse', 'evt-pulse', -50),
      ],
      edges: [edge('class', 'fn'), edge('fn', 'evt-start'), edge('evt-start', 'evt-pulse')],
    };
    expect(collectMemberDefineNodeIds(pulseHigher, undefined, [], mockFns, mockEvts)).toEqual([
      'class',
      'fn',
      'evt-pulse',
      'evt-start',
    ]);

    // Flip Y → start emits first.
    const startHigher: GraphDocument = {
      nodes: [
        classNode,
        functionDefineNode('fn', 'fn-boot', 0),
        eventDefineNode('evt-start', 'evt-start', -80),
        eventDefineNode('evt-pulse', 'evt-pulse', 40),
      ],
      edges: [edge('class', 'fn'), edge('fn', 'evt-start'), edge('evt-start', 'evt-pulse')],
    };
    expect(collectMemberDefineNodeIds(startHigher, undefined, [], mockFns, mockEvts)).toEqual([
      'class',
      'fn',
      'evt-start',
      'evt-pulse',
    ]);
  });
});
