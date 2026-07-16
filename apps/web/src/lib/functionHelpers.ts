import type { PinDefinition, PinType, FunctionSymbol, VVSNodeData } from '@/types/graph';
import type { GraphTab } from '@vvs/graph-types';
import type { Dispatch, SetStateAction } from 'react';
import { formatFunctionTabName } from '@/lib/functionTabs';
import { resolveNodeKindId } from '@/lib/nodeKind';

const EXEC_IN: PinDefinition = { id: 'exec_in', label: '', type: 'execution' };
const EXEC_OUT: PinDefinition = { id: 'exec_out', label: '', type: 'execution' };

export function resolveFunctionForNode(
  data: VVSNodeData,
  functions: FunctionSymbol[]
): FunctionSymbol | undefined {
  const symbolId =
    data.graphBinding?.symbolId ??
    data.linkedGraphId ??
    (typeof data.properties?.functionId === 'string' ? data.properties.functionId : undefined);
  if (!symbolId) return undefined;
  return functions.find((f) => f.id === symbolId);
}

export function resolveOverloadForCall(
  func: FunctionSymbol,
  overloadId?: string
): FunctionSymbol['overloads'][number] {
  if (overloadId) {
    const found = func.overloads.find((o) => o.id === overloadId);
    if (found) return found;
  }
  return func.overloads[0]!;
}

export function callNodeInputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  const overload = resolveOverloadForCall(func, overloadId);
  return [
    EXEC_IN,
    ...overload.parameters.map((p) => ({
      id: p.id,
      label: p.label,
      type: p.type,
    })),
  ];
}

export function callNodeOutputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  const overload = resolveOverloadForCall(func, overloadId);
  const outputs: PinDefinition[] = [EXEC_OUT];
  if (overload.returnType && overload.returnType !== 'void') {
    outputs.push({
      id: 'return_val',
      label: 'Return',
      type: overload.returnType as PinType,
    });
  }
  return outputs;
}

export function functionEntryOutputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  const overload = resolveOverloadForCall(func, overloadId);
  return [
    EXEC_OUT,
    ...overload.parameters.map((p) => ({
      id: p.id,
      label: p.label,
      type: p.type,
    })),
  ];
}

export function applyFunctionImplementBinding(
  data: VVSNodeData,
  func: FunctionSymbol,
  overloadId?: string
): VVSNodeData {
  const overload = resolveOverloadForCall(func, overloadId ?? data.graphBinding?.overloadId);
  return {
    ...data,
    label: `Define ${func.name}`,
    category: 'Project',
    kindId: 'function_implement',
    linkKind: 'call_function',
    linkedGraphId: func.id,
    graphBinding: {
      kind: 'call_function',
      symbolId: func.id,
      overloadId: overload.id,
    },
    properties: {
      ...data.properties,
      symbolId: func.id,
      name: func.name,
      graphTabId: overload.graphTabId ?? func.id,
    },
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
  };
}

export function buildFunctionImplementData(func: FunctionSymbol, overloadId?: string): VVSNodeData {
  return applyFunctionImplementBinding(
    {
      label: `Define ${func.name}`,
      category: 'Project',
      kindId: 'function_implement',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      inlineValues: {},
    },
    func,
    overloadId
  );
}

export function applyFunctionCallBinding(
  data: VVSNodeData,
  func: FunctionSymbol,
  overloadId?: string
): VVSNodeData {
  const overload = resolveOverloadForCall(func, overloadId ?? data.graphBinding?.overloadId);
  return {
    ...data,
    label: `Call ${func.name}`,
    kindId: 'vvs.project.call_function',
    linkKind: 'call_function',
    linkedGraphId: func.id,
    graphBinding: {
      kind: 'call_function',
      symbolId: func.id,
      overloadId: overload.id,
    },
    properties: {
      ...data.properties,
      functionId: func.id,
      functionName: func.name,
      overloadId: overload.id,
    },
    inputs: callNodeInputs(func, overload.id),
    outputs: callNodeOutputs(func, overload.id),
  };
}

export function syncCallNodesForFunction(
  nodes: Array<{ id: string; type: string; data: VVSNodeData }>,
  func: FunctionSymbol
): Array<{ id: string; type: string; data: VVSNodeData }> {
  return nodes.map((node) => {
    if (node.type !== 'vvs_standard_node') return node;
    const kindId = resolveNodeKindId(node.data);
    const isCall =
      kindId === 'vvs.project.call_function' ||
      node.data.linkKind === 'call_function' ||
      kindId.startsWith('call_function_');
    if (!isCall) return node;
    const bound =
      node.data.graphBinding?.symbolId ??
      node.data.linkedGraphId ??
      (typeof node.data.properties?.functionId === 'string' ? node.data.properties.functionId : undefined);
    if (bound !== func.id) return node;
    return {
      ...node,
      data: applyFunctionCallBinding(node.data, func, node.data.graphBinding?.overloadId),
    };
  });
}

export const FUNCTION_RENAMED_EVENT = 'vvs:function-renamed';

export const FUNCTION_OVERLOAD_DRAG_MIME = 'application/vvs-function-overload';

export interface FunctionOverloadDragPayload {
  functionId: string;
  overloadId: string;
}

export function dispatchFunctionRenamed(func: FunctionSymbol): void {
  window.dispatchEvent(new CustomEvent(FUNCTION_RENAMED_EVENT, { detail: { func } }));
}

/** Persist a function symbol edit and sync open tabs + call nodes on the canvas. */
export function commitFunctionSymbolUpdate(
  next: FunctionSymbol,
  setFunctions: Dispatch<SetStateAction<FunctionSymbol[]>>,
  setOpenTabs?: Dispatch<SetStateAction<GraphTab[]>>
): void {
  setFunctions((list) => list.map((f) => (f.id === next.id ? next : f)));
  if (setOpenTabs) {
    const tabName = formatFunctionTabName(next.name);
    setOpenTabs((tabs) =>
      tabs.map((tab) => (tab.id === next.id && tab.type === 'function' ? { ...tab, name: tabName } : tab))
    );
  }
  dispatchFunctionRenamed(next);
}
