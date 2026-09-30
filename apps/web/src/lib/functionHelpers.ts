import type { FunctionSymbol, VVSNodeData } from '@/types/graph';
import type { GraphTab } from '@vvs/graph-types';
import type { Dispatch, SetStateAction } from 'react';
import { formatFunctionTabName } from '@/lib/functionTabs';
import { resolveNodeKindId } from '@/lib/nodeKind';

export { resolveFunctionForNode, resolveOverloadForCall, callNodeInputs, callNodeOutputs, functionEntryOutputs, defineNodeInputs, returnNodeInputs, applyFunctionReturnBinding, defineNodeOutputs, implementNodeInputs, implementNodeOutputs, applyFunctionImplementBinding, applyFunctionEntryBinding, applyFunctionDefineBinding, buildFunctionImplementData, applyFunctionCallBinding } from '@vvs/graph-types';
import { applyFunctionReturnBinding, applyFunctionImplementBinding, applyFunctionEntryBinding, applyFunctionDefineBinding, applyFunctionCallBinding } from '@vvs/graph-types';

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
