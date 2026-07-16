import type { GraphNode } from './nodes';
import type { PinType } from './pins';
import type { TypeRef } from './typeRef';

/** Execution and data pins cannot share a wire; data_any is a wildcard. */
export function pinsAreCompatible(
  sourceType: PinType,
  targetType: PinType,
  sourceTypeRef?: TypeRef,
  targetTypeRef?: TypeRef
): boolean {
  if (sourceType === 'execution') return targetType === 'execution';
  if (targetType === 'execution') return false;

  if (sourceTypeRef && targetTypeRef) {
    return typeRefsAreCompatible(sourceTypeRef, targetTypeRef);
  }

  if (sourceType === 'data_any' || targetType === 'data_any') return true;
  return sourceType === targetType;
}

/** Same enum/class identity only; containers require matching structure. */
export function typeRefsAreCompatible(source: TypeRef, target: TypeRef): boolean {
  if (source.kind !== target.kind) return false;
  switch (source.kind) {
    case 'builtin':
      return target.kind === 'builtin' && source.id === target.id;
    case 'enum':
      return target.kind === 'enum' && source.name === target.name;
    case 'class':
      return target.kind === 'class' && source.classId === target.classId;
    case 'array':
      return target.kind === 'array' && typeRefsAreCompatible(source.of, target.of);
    case 'map':
      return (
        target.kind === 'map' &&
        typeRefsAreCompatible(source.key, target.key) &&
        typeRefsAreCompatible(source.value, target.value)
      );
  }
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

export function resolveOutputTypeRef(
  node: GraphNode,
  handleId: string | null | undefined
): TypeRef | undefined {
  if (node.type === 'vvs_comment_node' || node.type === 'vvs_reroute_node') return undefined;
  const pin = node.data.outputs?.find((p) => p.id === handleId);
  return pin?.typeRef;
}

export function resolveInputTypeRef(
  node: GraphNode,
  handleId: string | null | undefined
): TypeRef | undefined {
  if (node.type === 'vvs_comment_node' || node.type === 'vvs_reroute_node') return undefined;
  const pin = node.data.inputs?.find((p) => p.id === handleId);
  return pin?.typeRef;
}

export function edgePinTypes(
  source: GraphNode,
  target: GraphNode,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined
): {
  sourceType: PinType;
  targetType: PinType;
  sourceTypeRef?: TypeRef;
  targetTypeRef?: TypeRef;
} | null {
  const sourceType = resolveOutputPinType(source, sourceHandle);
  const targetType = resolveInputPinType(target, targetHandle);
  if (!sourceType || !targetType) return null;
  return {
    sourceType,
    targetType,
    sourceTypeRef: resolveOutputTypeRef(source, sourceHandle),
    targetTypeRef: resolveInputTypeRef(target, targetHandle),
  };
}
