import type { GraphNode } from './nodes';
import type { PinType } from './pins';

/** Execution and data pins cannot share a wire; data_any is a wildcard. */
export function pinsAreCompatible(sourceType: PinType, targetType: PinType): boolean {
  if (sourceType === 'execution') return targetType === 'execution';
  if (targetType === 'execution') return false;
  if (sourceType === 'data_any' || targetType === 'data_any') return true;
  return sourceType === targetType;
}

function reroutePinType(node: GraphNode): PinType {
  return (
    node.data.pinType ??
    node.data.outputs[0]?.type ??
    node.data.inputs[0]?.type ??
    'data_any'
  );
}

export function resolveOutputPinType(
  node: GraphNode,
  handleId: string | null | undefined
): PinType | null {
  if (node.type === 'vvs_comment_node') return null;
  if (node.type === 'vvs_reroute_node') {
    return reroutePinType(node);
  }
  const pin = node.data.outputs?.find((p) => p.id === handleId);
  return pin?.type ?? null;
}

export function resolveInputPinType(
  node: GraphNode,
  handleId: string | null | undefined
): PinType | null {
  if (node.type === 'vvs_comment_node') return null;
  if (node.type === 'vvs_reroute_node') {
    return reroutePinType(node);
  }
  const pin = node.data.inputs?.find((p) => p.id === handleId);
  return pin?.type ?? null;
}

export function edgePinTypes(
  source: GraphNode,
  target: GraphNode,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined
): { sourceType: PinType; targetType: PinType } | null {
  const sourceType = resolveOutputPinType(source, sourceHandle);
  const targetType = resolveInputPinType(target, targetHandle);
  if (!sourceType || !targetType) return null;
  return { sourceType, targetType };
}
