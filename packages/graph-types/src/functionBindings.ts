import { GO_SCALAR_PINS, CSHARP_INTEGRAL_PINS, CSHARP_RETURN_PINS, type GoScalarType, nativeSignature, withNativeParameters } from './nativeSignatures';
import type { PinDefinition } from './pins';
import type { FunctionSymbol } from './symbols';
import type { VVSNodeData } from './nodes';
import { overloadReturnParameters } from './symbols';
import { canonicalNativeScalarSignatureType, nativeScalarSignaturePin } from './nativeScalarSignatures';
import { nativeScalarSignatureEditorProfile } from './nativeScalarSignatureEdits';

const EXEC_IN: PinDefinition = { id: 'exec_in', label: '', type: 'execution' };
const EXEC_OUT: PinDefinition = { id: 'exec_out', label: '', type: 'execution' };

/** Rebind a visible parameter write after signature edits, preserving its
 * statement operator and RHS connections. Deleted slots stay invalid. */
export function applyParameterSetBinding(data: VVSNodeData, func: FunctionSymbol, overloadId?: string): VVSNodeData {
  const overload = func.overloads.find(overload => overload.id === (overloadId ?? data.graphBinding?.overloadId));
  const parameter = overload?.parameters.find(parameter => parameter.id === data.graphBinding?.parameterId);
  if (!overload || !parameter) return data;
  const update = ['++', '--'].includes(String(data.properties?.assignmentOperator));
  return { ...data, kindId: 'parameter_set', label: `Set parameter ${parameter.label}`, category: 'Parameters',
    graphBinding: { kind: 'parameter_ref', symbolId: func.id, overloadId: overload.id, parameterId: parameter.id },
    properties: { ...data.properties, functionId: func.id, overloadId: overload.id, parameterId: parameter.id, parameterName: parameter.label },
    inputs: update ? [EXEC_IN] : [EXEC_IN, { id: 'val', label: 'New Value', type: parameter.type, required: true }], outputs: [EXEC_OUT] };
}

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
  const goTypes = { data_number: 'float64', data_string: 'string', data_boolean: 'bool' } as const;
  const retainedType = (previous: unknown, pin: string | undefined) => typeof previous === 'string' && pin !== undefined && GO_SCALAR_PINS[previous as GoScalarType] === pin ? previous as GoScalarType : goTypes[pin as keyof typeof goTypes];
  const csharpTypes = data.properties?.nativeSignatureLanguage === 'csharp';
  const retainedNativeType = (previous: unknown, pin: string | undefined) => csharpTypes ? (typeof previous === 'string' && pin === CSHARP_INTEGRAL_PINS[previous as keyof typeof CSHARP_INTEGRAL_PINS] ? previous as keyof typeof CSHARP_INTEGRAL_PINS : undefined) : retainedType(previous, pin);
  const signature = nativeSignature(data);
  const scalarProfile = nativeScalarSignatureEditorProfile(data);
  const retainedScalarType = (previous: unknown, authored: unknown, pin: string | undefined) => scalarProfile && typeof previous === 'string' && typeof authored === 'string' && canonicalNativeScalarSignatureType(authored, scalarProfile.language) === previous && nativeScalarSignaturePin(previous, scalarProfile.language) === pin ? previous as import('./nativeScalarSignatures').NativeScalarSignatureType : undefined;
  if (signature?.every(parameter => parameter && typeof parameter.id === 'string')) data = withNativeParameters(data, overload.parameters.map(parameter => ({ ...signature.find(previous => previous.id === parameter.id), id: parameter.id, name: parameter.label, mode: signature.find(previous => previous.id === parameter.id)?.mode ?? 'positional', ...(scalarProfile ? { nativeType: retainedScalarType(signature.find(previous => previous.id === parameter.id)?.nativeType, signature.find(previous => previous.id === parameter.id)?.authoredType, parameter.type) } : ['go', 'csharp'].includes(String(data.properties?.nativeSignatureLanguage)) ? { nativeType: retainedNativeType(signature.find(previous => previous.id === parameter.id)?.nativeType, parameter.type) } : {}) })));
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
      ...(scalarProfile ? { functionName: func.name, nativeReturnType: overload.returnType === 'void' ? data.properties?.nativeReturnType === scalarProfile.unit && data.properties?.nativeAuthoredReturnType === scalarProfile.unit ? scalarProfile.unit : undefined : retainedScalarType(data.properties?.nativeReturnType, data.properties?.nativeAuthoredReturnType, overload.returnType) } : {}),
      ...(['go', 'csharp'].includes(String(data.properties?.nativeSignatureLanguage)) ? { nativeReturnType: overload.returnType === 'void' ? 'void' : csharpTypes && data.properties?.nativeReturnType === 'bool' && overload.returnType === CSHARP_RETURN_PINS.bool ? 'bool' : retainedNativeType(data.properties?.nativeReturnType, overload.returnType) } : {}),
      ...(func.flags?.virtual ? { isVirtual: true } : {}),
      ...(func.flags?.override ? { isOverride: true } : {}),
    },
    inputs: [...implementNodeInputs(func, overload.id), ...(Array.isArray(data.properties?.nativeParameters) ? data.inputs.filter(pin => pin.id.startsWith('default-')) : [])],
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
    label: `Call ${func.name}${data.properties?.callPlacement === 'expression' ? ' (expression)' : ''}`,
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
    inputs: (data.properties?.nativeArgumentCount !== undefined
      ? [...callNodeInputs(func, overload.id).filter(pin => pin.type === 'execution'), ...data.inputs.filter(pin => pin.type !== 'execution')]
      : callNodeInputs(func, overload.id)).filter(pin => data.properties?.callPlacement !== 'expression' || pin.type !== 'execution'),
    outputs: callNodeOutputs(func, overload.id).filter(pin => data.properties?.callPlacement !== 'expression' || pin.type !== 'execution'),
  };
}
