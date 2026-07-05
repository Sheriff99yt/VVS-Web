import type { Dispatch, SetStateAction } from 'react';
import type { PinDefinition, PinType, VariableSymbol, VVSNodeData } from '@/types/graph';
import { defaultValueForDataType } from '@vvs/graph-types';
import { resolveNodeKindId } from '@/lib/nodeKind';

const EXEC_IN: PinDefinition = { id: 'exec_in', label: '', type: 'execution' };
const EXEC_OUT: PinDefinition = { id: 'exec_out', label: '', type: 'execution' };

export function resolveVariableForNode(
  data: VVSNodeData,
  variables: VariableSymbol[]
): VariableSymbol | undefined {
  const symbolId =
    data.graphBinding?.kind === 'variable_ref'
      ? data.graphBinding.symbolId
      : undefined;
  if (symbolId) {
    return variables.find((v) => v.id === symbolId);
  }
  const name =
    typeof data.properties?.variableName === 'string' ? data.properties.variableName : undefined;
  if (name) {
    return variables.find((v) => v.name === name);
  }
  return undefined;
}

export function variableGetSetPins(variable: VariableSymbol, role: 'get' | 'set'): {
  inputs: PinDefinition[];
  outputs: PinDefinition[];
} {
  const dataPin: PinDefinition = {
    id: 'val',
    label: role === 'get' ? variable.name : 'New Value',
    type: variable.type as PinType,
  };
  if (role === 'get') {
    return { inputs: [], outputs: [dataPin] };
  }
  return {
    inputs: [EXEC_IN, dataPin],
    outputs: [EXEC_OUT],
  };
}

export function applyVariableRefBinding(
  data: VVSNodeData,
  variable: VariableSymbol,
  role: 'get' | 'set'
): VVSNodeData {
  const pins = variableGetSetPins(variable, role);
  return {
    ...data,
    label: `${role === 'get' ? 'Get' : 'Set'} ${variable.name}`,
    category: 'Variables',
    kindId: role === 'get' ? 'variable_get' : 'variable_set',
    graphBinding: { kind: 'variable_ref', symbolId: variable.id },
    properties: { ...data.properties, variableName: variable.name },
    inputs: pins.inputs,
    outputs: pins.outputs,
  };
}

export function syncVariableNodesForSymbol(
  nodes: Array<{ id: string; type: string; data: VVSNodeData }>,
  variable: VariableSymbol
): Array<{ id: string; type: string; data: VVSNodeData }> {
  return nodes.map((node) => {
    if (node.type !== 'vvs_standard_node') return node;
    const data = node.data;
    const bound =
      data.graphBinding?.kind === 'variable_ref' && data.graphBinding.symbolId === variable.id;
    const legacyName =
      typeof data.properties?.variableName === 'string' ? data.properties.variableName : undefined;
    if (!bound && legacyName !== variable.name) return node;

    const kindId = resolveNodeKindId(data);
    if (kindId === 'variable_get') {
      return { ...node, data: applyVariableRefBinding(data, variable, 'get') };
    }
    if (kindId === 'variable_set') {
      return { ...node, data: applyVariableRefBinding(data, variable, 'set') };
    }
    return node;
  });
}

export function commitVariableSymbolUpdate(
  variable: VariableSymbol,
  setVariables: Dispatch<SetStateAction<VariableSymbol[]>>
): void {
  setVariables((list) => list.map((v) => (v.id === variable.id ? variable : v)));
}

export { defaultValueForDataType as defaultValueForVariableType };

export function coerceVariableDefaultValue(
  type: VariableSymbol['type'],
  value: VariableSymbol['defaultValue']
): VariableSymbol['defaultValue'] {
  if (type === 'data_object') {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }
  if (type === 'data_array') {
    return Array.isArray(value) ? value : [];
  }
  if (type === 'data_any') {
    return value ?? null;
  }
  return defaultValueForDataType(type);
}
