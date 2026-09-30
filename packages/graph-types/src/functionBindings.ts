import type { PinDefinition } from './pins';
import type { FunctionSymbol } from './symbols';
import type { VVSNodeData } from './nodes';
import { overloadReturnParameters } from './symbols';

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

