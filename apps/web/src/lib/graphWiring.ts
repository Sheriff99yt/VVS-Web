import type { Connection } from '@xyflow/react';
import type { PinDefinition, PinType, VVSEdge, VVSNode } from '@/types/graph';
import { resolveNodePin, applyWireConnection as applyCoreWire, createWireEdge as coreEdge, type WireConnectionAttempt, type WireRejectionReason } from '@vvs/graph-types';
import { readUiPreferences } from './uiPreferences';
export { resolveNodePin, pinsAreCompatible, evaluateWireConnection, isValidWireConnection, edgesWithoutTargetHandle, edgesWithoutSourceHandle, wireRejectionMessage } from '@vvs/graph-types';
export type { WireConnectionAttempt, WireRejectionReason, ResolvedWirePin, WireEvaluation } from '@vvs/graph-types';
export function createUniqueEdgeId(source: string, target: string, options?: { prefix?: string; index?: number }): string {
  return `${options?.prefix ?? 'e'}-${source}-${target}-${crypto.randomUUID()}-${options?.index ?? 0}`;
}
export function createWireEdge(connection: WireConnectionAttempt, pinType: PinType, edgeId?: string): VVSEdge {
 return coreEdge(connection, pinType, edgeId ?? createUniqueEdgeId(connection.source, connection.target)) as VVSEdge;
}
export function applyWireConnection(connection: WireConnectionAttempt, nodes: VVSNode[], edges: VVSEdge[]): { edges: VVSEdge[]; edge: VVSEdge; chainBreak?: { droppedSourceId: string; targetId: string } } | { error: WireRejectionReason } {
 return applyCoreWire(connection, nodes, edges, createUniqueEdgeId(connection.source, connection.target), { allowMultipleExecToInput: readUiPreferences().allowMultipleExecToInput }) as ReturnType<typeof applyWireConnection>;
}
export function connectionFromReactFlow(connection: Connection): WireConnectionAttempt {
  return {
    source: connection.source!,
    target: connection.target!,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
  };
}

export function pinTypeFromDragHandle(
  node: VVSNode,
  handleId: string | null | undefined,
  handleType: 'source' | 'target' | undefined
): PinType {
  if (!handleId || !handleType) return 'data_any';
  const resolved = resolveNodePin(node, handleId, handleType);
  return resolved?.pinType ?? 'data_any';
}

export function findCompatiblePin(
  pins: PinDefinition[],
  preferredType: PinType,
  direction: 'input' | 'output'
): PinDefinition | undefined {
  const exact = pins.find((p) => p.type === preferredType);
  if (exact) return exact;
  if (preferredType === 'data_any') return pins[0];
  return pins.find((p) => p.type === 'data_any') ?? pins.find((p) => p.type === preferredType);
}

export function createRerouteNode(
  position: { x: number; y: number },
  pinType: PinType,
  id?: string
): VVSNode {
  return {
    id: id ?? `reroute-${Date.now()}`,
    type: 'vvs_reroute_node',
    position,
    data: {
      label: '',
      category: 'Routing',
      pinType,
      inputs: [{ id: 'in', label: '', type: pinType }],
      outputs: [{ id: 'out', label: '', type: pinType }],
      inlineValues: {},
    },
  };
}

/** Split one edge by inserting a reroute node at `position`. */
export function splitEdgeWithReroute(
  edge: VVSEdge,
  position: { x: number; y: number },
  rerouteId?: string
): { node: VVSNode; edges: VVSEdge[] } {
  const pinType = edge.data?.pinType ?? 'data_any';
  const node = createRerouteNode(position, pinType, rerouteId);
  const edgeData = edge.data ?? { pinType };

  const edges: VVSEdge[] = [
    {
      id: createUniqueEdgeId(edge.source, node.id, { index: 0 }),
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: node.id,
      targetHandle: 'in',
      type: 'vvs_standard_edge',
      data: edgeData,
    },
    {
      id: createUniqueEdgeId(node.id, edge.target, { index: 1 }),
      source: node.id,
      sourceHandle: 'out',
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: 'vvs_standard_edge',
      data: edgeData,
    },
  ];

  return { node, edges };
}
