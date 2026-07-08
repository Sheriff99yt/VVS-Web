import type {
  ClassSymbol,
  FunctionSymbol,
  ProjectEventDefinition,
  VariableSymbol,
  VVSEdge,
  VVSNode,
  VVSNodeData,
} from '@/types/graph';
import { normalizeNodeData } from '@/lib/nodeKind';
import { applyVariableRefBinding } from '@/lib/variableHelpers';
import { applyFunctionCallBinding } from '@/lib/functionHelpers';
import { applyEventDefineBinding, applyEventDispatchBinding } from '@/lib/eventHelpers';
import { buildGraphRefNodeData } from '@/lib/graphRefHelpers';

const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };
const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };

export function exampleNode(
  id: string,
  position: { x: number; y: number },
  data: VVSNodeData
): VVSNode {
  return {
    id,
    type: 'vvs_standard_node',
    position,
    data: { ...data, inlineValues: data.inlineValues ?? {} },
  };
}

export function execEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle = 'exec_out',
  targetHandle = 'exec_in'
): VVSEdge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'vvs_standard_edge',
    data: { pinType: 'execution' },
  };
}

export function dataEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  pinType: 'data_number' | 'data_boolean' | 'data_string' | 'data_any' = 'data_any'
): VVSEdge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'vvs_standard_edge',
    data: { pinType },
  };
}

/** Normalize spawned example nodes (kindId, property defaults, typed pins). */
export function normalizeExampleNodes(nodes: VVSNode[]): VVSNode[] {
  return nodes.map((node) => ({
    ...node,
    data: normalizeNodeData(node.data),
  }));
}

export function exampleDocument(nodes: VVSNode[], edges: VVSEdge[]): { nodes: VVSNode[]; edges: VVSEdge[] } {
  return { nodes: normalizeExampleNodes(nodes), edges };
}

export function printStringNode(
  id: string,
  position: { x: number; y: number },
  message?: string
): VVSNode {
  const inlineValues: Record<string, string | number | boolean> = {};
  if (message !== undefined) {
    inlineValues.in_str = message;
  }
  return exampleNode(id, position, {
    label: 'Print String',
    category: 'Action',
    kindId: 'action_print',
    inputs: [EXEC_IN, { id: 'in_str', label: 'String', type: 'data_string' }],
    outputs: [EXEC_OUT],
    inlineValues,
  });
}

export function branchNode(id: string, position: { x: number; y: number }): VVSNode {
  return exampleNode(id, position, {
    label: 'Branch',
    category: 'Flow Control',
    kindId: 'flow_branch',
    inputs: [
      EXEC_IN,
      { id: 'condition', label: 'Condition', type: 'data_boolean' },
    ],
    outputs: [
      { id: 'true_exec', label: 'True', type: 'execution' },
      { id: 'false_exec', label: 'False', type: 'execution' },
    ],
    inlineValues: {},
  });
}

export function mathAddNode(id: string, position: { x: number; y: number }): VVSNode {
  return exampleNode(id, position, {
    label: 'Math Add',
    category: 'Math',
    kindId: 'math_add',
    inputs: [
      { id: 'a', label: 'A', type: 'data_number' },
      { id: 'b', label: 'B', type: 'data_number' },
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'data_number' }],
    inlineValues: {},
  });
}

export function boundVariableGet(
  id: string,
  position: { x: number; y: number },
  variable: VariableSymbol
): VVSNode {
  const empty: VVSNodeData = {
    label: '',
    category: 'Variables',
    inputs: [],
    outputs: [],
    inlineValues: {},
  };
  return exampleNode(id, position, applyVariableRefBinding(empty, variable, 'get'));
}

export function getUserInputNode(
  id: string,
  position: { x: number; y: number },
  options: {
    prompt: string;
    inputKind?: 'text' | 'number' | 'password';
  }
): VVSNode {
  const inputKind = options.inputKind ?? 'text';
  const valueType = inputKind === 'number' ? 'data_number' : 'data_string';
  const kindLabel = inputKind === 'number' ? 'Number' : inputKind === 'password' ? 'Password' : 'Text';

  return exampleNode(id, position, {
    label: `Get User Input · ${kindLabel}`,
    category: 'Action',
    kindId: 'action_get_input',
    inputs: [EXEC_IN, { id: 'prompt', label: 'Prompt', type: 'data_string' }],
    outputs: [
      EXEC_OUT,
      { id: 'value', label: 'Value', type: valueType },
    ],
    inlineValues: { prompt: options.prompt },
    properties: { inputKind, placeholder: '', required: true },
  });
}

export function convertToStringNode(id: string, position: { x: number; y: number }): VVSNode {
  return exampleNode(id, position, {
    label: 'To String',
    category: 'Conversion',
    kindId: 'convert_to_string',
    inputs: [{ id: 'value', label: 'Value', type: 'data_any' }],
    outputs: [{ id: 'result', label: 'String', type: 'data_string' }],
    inlineValues: {},
  });
}

export function convertToNumberNode(id: string, position: { x: number; y: number }): VVSNode {
  return exampleNode(id, position, {
    label: 'To Number',
    category: 'Conversion',
    kindId: 'convert_to_number',
    inputs: [{ id: 'value', label: 'Value', type: 'data_string' }],
    outputs: [{ id: 'result', label: 'Number', type: 'data_number' }],
    inlineValues: {},
  });
}

export function boundVariableSet(
  id: string,
  position: { x: number; y: number },
  variable: VariableSymbol,
  inlineValue?: string | number | boolean
): VVSNode {
  const empty: VVSNodeData = {
    label: '',
    category: 'Variables',
    inputs: [],
    outputs: [],
    inlineValues: {},
  };
  const data = applyVariableRefBinding(empty, variable, 'set');
  if (inlineValue !== undefined) {
    data.inlineValues = { ...data.inlineValues, val: inlineValue };
  }
  return exampleNode(id, position, data);
}

export function boundCallFunction(
  id: string,
  position: { x: number; y: number },
  func: FunctionSymbol
): VVSNode {
  const empty: VVSNodeData = {
    label: '',
    category: 'Project',
    inputs: [],
    outputs: [],
    inlineValues: {},
  };
  return exampleNode(id, position, applyFunctionCallBinding(empty, func));
}

export function boundImportClass(
  id: string,
  position: { x: number; y: number },
  cls: ClassSymbol,
  options?: { alias?: string }
): VVSNode {
  return exampleNode(id, position, {
    label: `Import Class ${cls.name}`,
    category: 'Imports',
    kindId: 'import_class',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    graphBinding: { kind: 'import_class', symbolId: cls.id, targetClassId: cls.id },
    properties: {
      targetClassId: cls.id,
      ...(options?.alias ? { alias: options.alias } : {}),
    },
  });
}

export function boundEventDefine(
  id: string,
  position: { x: number; y: number },
  event: ProjectEventDefinition
): VVSNode {
  const empty: VVSNodeData = {
    label: '',
    category: 'Events',
    inputs: [],
    outputs: [],
    inlineValues: {},
  };
  return exampleNode(id, position, applyEventDefineBinding(empty, event));
}

export function boundEventDispatch(
  id: string,
  position: { x: number; y: number },
  event: ProjectEventDefinition
): VVSNode {
  const empty: VVSNodeData = {
    label: '',
    category: 'Events',
    inputs: [],
    outputs: [],
    inlineValues: {},
  };
  return exampleNode(id, position, applyEventDispatchBinding(empty, event));
}

export function functionEntryNode(
  id: string,
  position: { x: number; y: number },
  func: FunctionSymbol
): VVSNode {
  return exampleNode(id, position, {
    label: func.name,
    category: 'Events',
    kindId: 'function_entry',
    properties: { functionId: func.id, symbolId: func.id, name: func.name },
    inputs: [],
    outputs: [EXEC_OUT],
    inlineValues: {},
  });
}

export function classDefineNode(
  id: string,
  position: { x: number; y: number },
  cls: ClassSymbol
): VVSNode {
  return exampleNode(id, position, {
    label: `Class ${cls.name}`,
    category: 'Project',
    kindId: 'class_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    properties: {
      name: cls.name,
      extendsType: cls.extendsType ?? '',
      visibility: cls.visibility ?? 'public',
    },
  });
}

export function varDefineNode(
  id: string,
  position: { x: number; y: number },
  variable: VariableSymbol
): VVSNode {
  return exampleNode(id, position, {
    label: `Define ${variable.name}`,
    category: 'Variables',
    kindId: 'var_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    graphBinding: { kind: 'variable_ref', symbolId: variable.id },
    properties: {
      symbolId: variable.id,
      name: variable.name,
      type: variable.type,
      default: variable.defaultValue,
      binding: variable.binding,
      variableName: variable.name,
    },
  });
}

export function functionDefineNode(
  id: string,
  position: { x: number; y: number },
  func: FunctionSymbol
): VVSNode {
  const overload = func.overloads[0];
  return exampleNode(id, position, {
    label: `Define ${func.name}`,
    category: 'Project',
    kindId: 'function_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    linkedGraphId: func.id,
    linkKind: 'call_function',
    graphBinding: { kind: 'call_function', symbolId: func.id, overloadId: overload?.id },
    properties: {
      symbolId: func.id,
      name: func.name,
      binding: func.binding,
      returnType: overload?.returnType,
      graphTabId: overload?.graphTabId ?? func.id,
    },
  });
}

export function eventMemberDefineNode(
  id: string,
  position: { x: number; y: number },
  event: ProjectEventDefinition
): VVSNode {
  return exampleNode(id, position, {
    label: `Define ${event.name}`,
    category: 'Events',
    kindId: 'event_member_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    properties: {
      symbolId: event.id,
      name: event.name,
      eventId: event.id,
      eventName: event.name,
    },
  });
}

export function graphRefNode(
  id: string,
  position: { x: number; y: number },
  options: {
    label: string;
    classId?: string;
    containerId?: string;
    graphTabId?: string;
  }
): VVSNode {
  return exampleNode(id, position, buildGraphRefNodeData(options));
}
