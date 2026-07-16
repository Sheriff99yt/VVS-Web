import type { Connection } from '@xyflow/react';
import type { PinDefinition, PinType, VVSEdge, VVSNode } from '@/types/graph';
import { pinsAreCompatible, type TypeRef } from '@vvs/graph-types';
import { wouldWireCreateCycle } from './graphCycles';

export type WireRejectionReason =
  | 'missing_node'
  | 'missing_pin'
  | 'incompatible_channel'
  | 'incompatible_type'
  | 'cycle'
  | 'self_connection';

export interface WireConnectionAttempt {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface ResolvedWirePin {
  nodeId: string;
  pinId: string;
  pinType: PinType;
  typeRef?: TypeRef;
  direction: 'input' | 'output';
}

export type WireEvaluation =
  | { ok: true; pinType: PinType; source: ResolvedWirePin; target: ResolvedWirePin }
  | { ok: false; reason: WireRejectionReason };

export { pinsAreCompatible };

export function resolveNodePin(
  node: VVSNode,
  handleId: string | null | undefined,
  direction: 'source' | 'target'
): ResolvedWirePin | null {
  if (node.type === 'vvs_comment_node') return null;

  if (node.type === 'vvs_reroute_node') {
    const pinType =
      node.data.pinType ??
      node.data.outputs[0]?.type ??
      node.data.inputs[0]?.type ??
      'data_any';
    return {
      nodeId: node.id,
      pinId: handleId ?? (direction === 'source' ? 'out' : 'in'),
      pinType,
      direction: direction === 'source' ? 'output' : 'input',
    };
  }

  if (direction === 'source') {
    const pin = node.data.outputs.find((o) => o.id === handleId);
    if (!pin) return null;
    return {
      nodeId: node.id,
      pinId: pin.id,
      pinType: pin.type,
      typeRef: pin.typeRef,
      direction: 'output',
    };
  }

  const pin = node.data.inputs.find((i) => i.id === handleId);
  if (!pin) return null;
  return {
    nodeId: node.id,
    pinId: pin.id,
    pinType: pin.type,
    typeRef: pin.typeRef,
    direction: 'input',
  };
}

export function wireRejectionMessage(reason: WireRejectionReason): string {
  switch (reason) {
    case 'missing_node':
      return 'Connection failed — node not found.';
    case 'missing_pin':
      return 'Connection failed — pin not found.';
    case 'incompatible_channel':
      return 'Execution wires can only connect to execution pins.';
    case 'incompatible_type':
      return 'Pin types are not compatible.';
    case 'cycle':
      return 'Circular wire connection is not allowed.';
    case 'self_connection':
      return 'A node cannot connect to itself.';
    default:
      return 'Connection not allowed.';
  }
}

export function evaluateWireConnection(
  connection: WireConnectionAttempt,
  nodes: VVSNode[],
  edges: VVSEdge[]
): WireEvaluation {
  if (connection.source === connection.target) {
    return { ok: false, reason: 'self_connection' };
  }

  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);
  if (!sourceNode || !targetNode) {
    return { ok: false, reason: 'missing_node' };
  }

  const source = resolveNodePin(sourceNode, connection.sourceHandle, 'source');
  const target = resolveNodePin(targetNode, connection.targetHandle, 'target');
  if (!source || !target) {
    return { ok: false, reason: 'missing_pin' };
  }

  if (
    (source.pinType === 'execution') !== (target.pinType === 'execution')
  ) {
    return { ok: false, reason: 'incompatible_channel' };
  }

  if (!pinsAreCompatible(source.pinType, target.pinType, source.typeRef, target.typeRef)) {
    return { ok: false, reason: 'incompatible_type' };
  }

  const pinType: PinType =
    source.pinType === 'execution'
      ? 'execution'
      : source.pinType !== 'data_any'
        ? source.pinType
        : target.pinType;

  if (wouldWireCreateCycle(edges, connection.source, connection.target, pinType)) {
    return { ok: false, reason: 'cycle' };
  }

  return { ok: true, pinType, source, target };
}

export function isValidWireConnection(
  connection: WireConnectionAttempt,
  nodes: VVSNode[],
  edges: VVSEdge[]
): boolean {
  return evaluateWireConnection(connection, nodes, edges).ok;
}

/** One wire per input pin — replaces any existing link on that target handle. */
export function edgesWithoutTargetHandle(
  edges: VVSEdge[],
  targetNodeId: string,
  targetHandleId: string
): VVSEdge[] {
  return edges.filter(
    (e) => !(e.target === targetNodeId && e.targetHandle === targetHandleId)
  );
}

/** Linear flow: one execution wire per output pin — replaces downstream when rewiring. */
export function edgesWithoutSourceHandle(
  edges: VVSEdge[],
  sourceNodeId: string,
  sourceHandleId: string
): VVSEdge[] {
  return edges.filter(
    (e) =>
      !(
        e.source === sourceNodeId &&
        e.sourceHandle === sourceHandleId &&
        e.data?.pinType === 'execution'
      )
  );
}

function pruneEdgesForConnection(
  edges: VVSEdge[],
  evaluation: Extract<WireEvaluation, { ok: true }>
): VVSEdge[] {
  let next = edges;
  if (evaluation.target.pinId != null) {
    next = edgesWithoutTargetHandle(next, evaluation.target.nodeId, evaluation.target.pinId);
  }
  if (evaluation.pinType === 'execution' && evaluation.source.pinId != null) {
    next = edgesWithoutSourceHandle(next, evaluation.source.nodeId, evaluation.source.pinId);
  }
  return next;
}

export function createUniqueEdgeId(
  source: string,
  target: string,
  options?: { prefix?: string; index?: number }
): string {
  const prefix = options?.prefix ?? 'e';
  const index = options?.index ?? 0;
  return `${prefix}-${source}-${target}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createWireEdge(
  connection: WireConnectionAttempt,
  pinType: PinType,
  edgeId?: string
): VVSEdge {
  return {
    id: edgeId ?? createUniqueEdgeId(connection.source, connection.target),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle ?? null,
    targetHandle: connection.targetHandle ?? null,
    type: 'vvs_standard_edge',
    data: { pinType },
  };
}

/** Validate, dedupe target handle, and return the next edge list (or null if rejected). */
export function applyWireConnection(
  connection: WireConnectionAttempt,
  nodes: VVSNode[],
  edges: VVSEdge[]
): { edges: VVSEdge[]; edge: VVSEdge; chainBreak?: { droppedSourceId: string; targetId: string } } | { error: WireRejectionReason } {
  const evaluation = evaluateWireConnection(connection, nodes, edges);
  if (!evaluation.ok) {
    return { error: evaluation.reason };
  }

  let chainBreak: { droppedSourceId: string; targetId: string } | undefined;
  if (evaluation.pinType === 'execution') {
    const dropped = edges.find(
      (e) =>
        e.target === evaluation.target.nodeId &&
        e.data?.pinType === 'execution' &&
        (e.targetHandle === evaluation.target.pinId || e.targetHandle == null) &&
        e.source !== evaluation.source.nodeId
    );
    if (dropped) {
      chainBreak = { droppedSourceId: dropped.source, targetId: dropped.target };
    }
  }

  const pruned = pruneEdgesForConnection(edges, evaluation);

  const edge = createWireEdge(connection, evaluation.pinType);
  return { edges: [...pruned, edge], edge, chainBreak };
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
