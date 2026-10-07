import type { GraphNode, GraphEdge } from './nodes';
import type { PinType } from './pins';
import type { TypeRef } from './typeRef';
import { pinsAreCompatible } from './pinCompatibility';

export interface WirePolicy { allowMultipleExecToInput?: boolean }

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
  node: GraphNode,
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
  nodes: GraphNode[],
  edges: GraphEdge[]
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
  nodes: GraphNode[],
  edges: GraphEdge[]
): boolean {
  return evaluateWireConnection(connection, nodes, edges).ok;
}

/** One wire per input pin — replaces any existing link on that target handle. */
export function edgesWithoutTargetHandle(
  edges: GraphEdge[],
  targetNodeId: string,
  targetHandleId: string
): GraphEdge[] {
  return edges.filter(
    (e) => !(e.target === targetNodeId && e.targetHandle === targetHandleId)
  );
}

/** Linear flow: one execution wire per output pin — replaces downstream when rewiring. */
export function edgesWithoutSourceHandle(
  edges: GraphEdge[],
  sourceNodeId: string,
  sourceHandleId: string
): GraphEdge[] {
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
  edges: GraphEdge[],
  evaluation: Extract<WireEvaluation, { ok: true }>,
  policy: WirePolicy
): GraphEdge[] {
  let next = edges;
  const allowMultipleExec = policy.allowMultipleExecToInput ?? false;
  const isExec = evaluation.pinType === 'execution';

  if (evaluation.target.pinId != null) {
    if (!isExec || !allowMultipleExec) {
      next = edgesWithoutTargetHandle(next, evaluation.target.nodeId, evaluation.target.pinId);
    }
  }
  if (isExec && evaluation.source.pinId != null) {
    next = edgesWithoutSourceHandle(next, evaluation.source.nodeId, evaluation.source.pinId);
  }
  return next;
}

export function createWireEdge(
  connection: WireConnectionAttempt,
  pinType: PinType,
  edgeId: string
): GraphEdge {
  return {
    id: edgeId,
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
  nodes: GraphNode[],
  edges: GraphEdge[],
  edgeId: string,
  policy: WirePolicy = {}
): { edges: GraphEdge[]; edge: GraphEdge; chainBreak?: { droppedSourceId: string; targetId: string } } | { error: WireRejectionReason } {
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

  const pruned = pruneEdgesForConnection(edges, evaluation, policy);

  const edge = createWireEdge(connection, evaluation.pinType, edgeId);
  return { edges: [...pruned, edge], edge, chainBreak };
}


/** Returns true if adding sourceâ†’target would close a cycle on the same pin channel. */
export function wouldWireCreateCycle(
  edges: GraphEdge[],
  source: string,
  target: string,
  pinType: PinType
): boolean {
  if (source === target) return true;

  const relevant = edges.filter((e) => e.data?.pinType === pinType);
  return canReach(relevant, target, source);
}

function canReach(edges: GraphEdge[], start: string, goal: string): boolean {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }

  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === goal) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }
  return false;
}
