import type { ClassSymbol, GraphEdge, GraphNode, ProjectEventDefinition } from '@vvs/graph-types';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { CodegenContext } from './generate';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

export const TEST_ENTRY_EVENT: ProjectEventDefinition = {
  id: 'evt-start',
  name: 'start',
  role: 'entry',
  parameters: [],
  classId: MAIN_CLASS_ID,
};

export const TEST_MAIN_CLASS: ClassSymbol = {
  kind: 'class',
  id: MAIN_CLASS_ID,
  name: 'Demo',
  containerId: MAIN_GRAPH_CONTAINER_ID,
};

export function entryDefineChainNodes(): GraphNode[] {
  return [
    {
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
        properties: { name: 'Demo' },
      },
    },
    {
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
        properties: {
          symbolId: TEST_ENTRY_EVENT.id,
          eventId: TEST_ENTRY_EVENT.id,
          name: 'start',
        },
      },
    },
    {
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
        properties: {
          eventId: TEST_ENTRY_EVENT.id,
          eventName: 'start',
          symbolId: TEST_ENTRY_EVENT.id,
        },
      },
    },
  ];
}

export function entryDefineChainEdges(flowTargetId: string): GraphEdge[] {
  return [
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
      id: 'e-start-flow',
      source: 'start-1',
      target: flowTargetId,
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    },
  ];
}

export function withTestEntryGraph(
  base: Omit<CodegenContext, 'classes' | 'activeClassId' | 'projectEvents' | 'tabId'> & {
    nodes: GraphNode[];
    edges: GraphEdge[];
  },
  flowNodeId?: string
): CodegenContext {
  const chain = entryDefineChainNodes();
  const flowNodes = base.nodes;
  const flowTargetId =
    flowNodeId ??
    flowNodes.find((n) => n.data.inputs?.some((input) => input.type === 'execution'))?.id ??
    flowNodes[0]!.id;
  return {
    ...base,
    nodes: [...chain, ...flowNodes],
    edges: [...entryDefineChainEdges(flowTargetId), ...base.edges],
    projectEvents: [TEST_ENTRY_EVENT],
    classes: [TEST_MAIN_CLASS],
    activeClassId: MAIN_CLASS_ID,
    tabId: MAIN_GRAPH_CONTAINER_ID,
  };
}
