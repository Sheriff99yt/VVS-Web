import type { PinDefinition, PinType, FunctionSymbol, VVSNodeData } from '@/types/graph';
import type { GraphTab } from '@vvs/graph-types';
import { overloadReturnParameters } from '@vvs/graph-types';
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
  const returns = overloadReturnParameters(overload);
  return [
    EXEC_OUT,
    ...returns.map((p) => ({
      id: p.id,
      label: p.label,
      type: p.type,
    })),
  ];
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

export function defineNodeInputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  return [EXEC_IN];
}

export function returnNodeInputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  const overload = resolveOverloadForCall(func, overloadId);
  const returns = overloadReturnParameters(overload);
  return [
    EXEC_IN,
    ...returns.map((p) => ({
      id: p.id,
      label: p.label,
      type: p.type,
    })),
  ];
}

export function applyFunctionReturnBinding(
  data: VVSNodeData,
  func: FunctionSymbol,
  overloadId?: string
): VVSNodeData {
  const overload = resolveOverloadForCall(func, overloadId ?? data.graphBinding?.overloadId);
  return {
    ...data,
    label: 'Return',
    category: 'Flow Control',
    kindId: 'flow_return',
    graphBinding: {
      kind: 'call_function',
      symbolId: func.id,
      overloadId: overload.id,
    },
    properties: {
      ...data.properties,
      functionId: func.id,
      symbolId: func.id,
      overloadId: overload.id,
    },
    inputs: returnNodeInputs(func, overload.id),
    outputs: [],
  };
}

export function defineNodeOutputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  return [EXEC_OUT];
}

export function implementNodeInputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  return [EXEC_IN];
}

export function implementNodeOutputs(
  func: FunctionSymbol,
  overloadId?: string
): PinDefinition[] {
  return [EXEC_OUT];
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
      ...(func.flags?.virtual ? { isVirtual: true } : {}),
      ...(func.flags?.override ? { isOverride: true } : {}),
    },
    inputs: implementNodeInputs(func, overload.id),
    outputs: implementNodeOutputs(func, overload.id),
  };
}

export function applyFunctionEntryBinding(
  data: VVSNodeData,
  func: FunctionSymbol,
  overloadId?: string
): VVSNodeData {
  const overload = resolveOverloadForCall(
    func,
    overloadId ??
      data.graphBinding?.overloadId ??
      (typeof data.properties?.overloadId === 'string' ? data.properties.overloadId : undefined)
  );
  return {
    ...data,
    label: func.name,
    category: 'Events',
    kindId: 'function_entry',
    graphBinding: {
      kind: 'call_function',
      symbolId: func.id,
      overloadId: overload.id,
    },
    properties: {
      ...data.properties,
      functionId: func.id,
      symbolId: func.id,
      name: func.name,
      overloadId: overload.id,
    },
    inputs: [],
    outputs: functionEntryOutputs(func, overload.id),
  };
}

export function applyFunctionDefineBinding(
  data: VVSNodeData,
  func: FunctionSymbol,
  overloadId?: string
): VVSNodeData {
  const overload = resolveOverloadForCall(func, overloadId ?? data.graphBinding?.overloadId);
  return {
    ...data,
    label: `Declare ${func.name}`,
    category: 'Project',
    kindId: 'function_define',
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
      overloadId: overload.id,
    },
    inputs: defineNodeInputs(func, overload.id),
    outputs: defineNodeOutputs(func, overload.id),
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
  func: FunctionSymbol,
  activeTabId?: string
): Array<{ id: string; type: string; data: VVSNodeData }> {
  return nodes.map((node) => {
    if (node.type !== 'vvs_standard_node') return node;
    const kindId = resolveNodeKindId(node.data);
    const isCall =
      kindId === 'vvs.project.call_function' ||
      node.data.linkKind === 'call_function' ||
      kindId.startsWith('call_function_');
      
    const bound =
      node.data.graphBinding?.symbolId ??
      node.data.linkedGraphId ??
      (typeof node.data.properties?.functionId === 'string' ? node.data.properties.functionId : undefined);
      
    if (bound !== func.id) return node;

    let overloadId = node.data.graphBinding?.overloadId ?? 
      (typeof node.data.properties?.overloadId === 'string' ? node.data.properties.overloadId : undefined);
      
    if (!overloadId && activeTabId && activeTabId.startsWith(`${func.id}::`)) {
      overloadId = activeTabId.split('::')[1];
    }

    if (kindId === 'function_entry') {
      return { ...node, data: applyFunctionEntryBinding(node.data, func, overloadId) };
    }
    if (kindId === 'function_define') {
      return { ...node, data: applyFunctionDefineBinding(node.data, func, overloadId) };
    }
    if (kindId === 'function_implement') {
      return { ...node, data: applyFunctionImplementBinding(node.data, func, overloadId) };
    }
    if (kindId === 'flow_return' || kindId === 'action_return') {
      return { ...node, data: applyFunctionReturnBinding(node.data, func, overloadId) };
    }
    
    if (isCall) {
      return { ...node, data: applyFunctionCallBinding(node.data, func, overloadId) };
    }
    
    return node;
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
