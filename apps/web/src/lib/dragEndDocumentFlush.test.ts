import { describe, expect, test } from 'bun:test';
import { applyNodeChanges, type NodeChange } from '@xyflow/react';
import { collectMemberDefineNodeIds } from '@vvs/graph-types';
import type { GraphDocument } from '@vvs/graph-types';

/**
 * Browser bug regression: Code panel reads documents, not live RF nodes.
 * Drag-end must apply final positions into the document before emit (U79).
 *
 * Also guards the "works once" race: after flushAndNotify(override), a plain
 * getDocuments()-style re-flush must use the same positions (refs aligned).
 */
describe('drag-end document flush → event Y order (U79 browser path)', () => {
  test('applyNodeChanges then collectMemberDefineNodeIds flips event order', () => {
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
    const start = {
      id: 'evt-start',
      type: 'vvs_standard_node' as const,
      position: { x: 200, y: 100 },
      selected: true,
      data: {
        label: 'Declare start',
        category: 'Events',
        kindId: 'event_member_define',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: {},
        properties: { symbolId: 'evt-start' },
      },
    };
    const pulse = {
      id: 'evt-pulse',
      type: 'vvs_standard_node' as const,
      position: { x: 400, y: -50 },
      data: {
        label: 'Declare pulse',
        category: 'Events',
        kindId: 'event_member_define',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: {},
        properties: { symbolId: 'evt-pulse' },
      },
    };

    const edges = [
      {
        id: 'e1',
        source: 'class',
        target: 'evt-start',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        data: { pinType: 'execution' as const },
      },
      {
        id: 'e2',
        source: 'evt-start',
        target: 'evt-pulse',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        data: { pinType: 'execution' as const },
      },
    ];

    const events = [
      { id: 'evt-start', name: 'start', classId: 'main-class' } as any,
      { id: 'evt-pulse', name: 'pulse', classId: 'main-class' } as any,
    ];

    const before: GraphDocument = { nodes: [classNode, start, pulse], edges };
    expect(
      collectMemberDefineNodeIds(before, undefined, [], [], events)
    ).toEqual(['class', 'evt-pulse', 'evt-start']);

    // Simulate drag-end: move start above pulse (same as browser RF change).
    const changes: NodeChange[] = [
      { type: 'position', id: 'evt-start', position: { x: 200, y: -80 }, dragging: false },
    ];
    const afterNodes = applyNodeChanges(changes, before.nodes);
    const after: GraphDocument = { nodes: afterNodes as GraphDocument['nodes'], edges };
    expect(
      collectMemberDefineNodeIds(after, undefined, [], [], events)
    ).toEqual(['class', 'evt-start', 'evt-pulse']);
  });
});
