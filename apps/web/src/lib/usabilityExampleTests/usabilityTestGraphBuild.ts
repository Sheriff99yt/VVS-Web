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

export function usabilityTestNode(
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

/** Normalize spawned usability-test nodes (kindId, property defaults, typed pins). */
export function normalizeUsabilityTestNodes(nodes: VVSNode[]): VVSNode[] {
  return nodes.map((node) => ({
    ...node,
    data: normalizeNodeData(node.data),
  }));
}

export function usabilityTestDocument(nodes: VVSNode[], edges: VVSEdge[]): { nodes: VVSNode[]; edges: VVSEdge[] } {
  return { nodes: normalizeUsabilityTestNodes(nodes), edges };
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
  return usabilityTestNode(id, position, {
    label: 'Print String',
    category: 'Action',
    kindId: 'action_print',
    inputs: [EXEC_IN, { id: 'in_str', label: 'String', type: 'data_string' }],
    outputs: [EXEC_OUT],
    inlineValues,
  });
}

export function branchNode(id: string, position: { x: number; y: number }): VVSNode {
  return usabilityTestNode(id, position, {
    label: 'If',
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
  return usabilityTestNode(id, position, {
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

export function mathMulNode(id: string, position: { x: number; y: number }): VVSNode {
  return usabilityTestNode(id, position, {
    label: 'Math Multiply',
    category: 'Math',
    kindId: 'math_multiply',
    inputs: [
      { id: 'a', label: 'A', type: 'data_number' },
      { id: 'b', label: 'B', type: 'data_number' },
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'data_number' }],
    inlineValues: {},
  });
}

export function enumDefineNode(
  id: string,
  position: { x: number; y: number },
  name: string,
  members: string[]
): VVSNode {
  return usabilityTestNode(id, position, {
    label: `Enum ${name}`,
    category: 'Project',
    kindId: 'enum_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    properties: { name, symbolId: `enum-${name}`, members },
    inlineValues: {},
  });
}

export function switchNode(
  id: string,
  position: { x: number; y: number },
  cases: string[],
  options?: { enumType?: string }
): VVSNode {
  const properties: Record<string, string> = {};
  if (options?.enumType) properties.enumType = options.enumType;
  cases.forEach((c, idx) => {
    properties[`case${idx}`] = c;
  });
  return usabilityTestNode(id, position, {
    label: 'Switch',
    kindId: 'flow_switch',
    category: 'Control Flow',
    inputs: [EXEC_IN, { id: 'selector', label: 'Selector', type: 'data_any' }],
    outputs: [
      ...cases.map((c, idx) => ({ id: `case_${idx}`, label: c, type: 'execution' as const })),
      { id: 'default_exec', label: 'default', type: 'execution' as const },
      EXEC_OUT,
    ],
    properties,
    inlineValues: {},
  });
}

export function enumMemberNode(
  id: string,
  position: { x: number; y: number },
  enumName: string,
  member: string
): VVSNode {
  return usabilityTestNode(id, position, {
    label: `${enumName}.${member}`,
    kindId: 'expr_enum_member',
    category: 'Enums',
    inputs: [],
    outputs: [{ id: 'val', label: 'Member', type: 'data_any' }],
    properties: { enumName, member },
    inlineValues: {},
  });
}

export function importModuleNode(
  id: string,
  position: { x: number; y: number },
  options: {
    modulePath: string;
    importStyle?: 'module' | 'from' | 'include_system';
    importNames?: string;
    label?: string;
    /** When set, import emits only for these target languages. */
    targetLanguages?: string[];
    /** When set, import emits only for this class module (shared home graph). */
    ownerClassId?: string;
  }
): VVSNode {
  return usabilityTestNode(id, position, {
    label: options.label ?? `Import ${options.modulePath}`,
    kindId: 'vvs.project.import_module',
    category: 'Imports',
    linkKind: 'import_module',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    properties: {
      modulePath: options.modulePath,
      importStyle: options.importStyle ?? 'module',
      importNames: options.importNames ?? '',
      ...(options.targetLanguages?.length
        ? { targetLanguages: options.targetLanguages.join(',') }
        : {}),
      ...(options.ownerClassId ? { ownerClassId: options.ownerClassId } : {}),
    },
    inlineValues: {},
  });
}

export function forEachNode(id: string, position: { x: number; y: number }): VVSNode {
  return usabilityTestNode(id, position, {
    label: 'For Each',
    kindId: 'flow_for',
    category: 'Control Flow',
    inputs: [EXEC_IN, { id: 'array', label: 'array', type: 'data_array' }],
    outputs: [
      { id: 'loop_body', label: 'Loop Body', type: 'execution' },
      { id: 'completed', label: 'Completed', type: 'execution' },
      { id: 'element', label: 'Element', type: 'data_any' },
      { id: 'index', label: 'Index', type: 'data_number' },
    ],
    inlineValues: {},
  });
}

export function arrayPushNode(id: string, position: { x: number; y: number }): VVSNode {
  return usabilityTestNode(id, position, {
    label: 'Array Push',
    kindId: 'array_push',
    category: 'Action',
    inputs: [
      EXEC_IN,
      { id: 'array', label: 'Array', type: 'data_array' },
      { id: 'val', label: 'Value', type: 'data_any' },
    ],
    outputs: [EXEC_OUT],
    inlineValues: {},
  });
}

export function stringConcatNode(
  id: string,
  position: { x: number; y: number },
  prefix?: string
): VVSNode {
  const inlineValues: Record<string, string | number | boolean> = {};
  if (prefix !== undefined) inlineValues.a = prefix;
  return usabilityTestNode(id, position, {
    label: 'String Concat',
    kindId: 'string_concat',
    category: 'Action',
    inputs: [
      { id: 'a', label: 'A', type: 'data_string' },
      { id: 'b', label: 'B', type: 'data_string' },
    ],
    outputs: [{ id: 'result', label: 'Result', type: 'data_string' }],
    inlineValues,
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
  return usabilityTestNode(id, position, applyVariableRefBinding(empty, variable, 'get'));
}

export function getUserInputNode(
  id: string,
  position: { x: number; y: number },
  options: {
    prompt: string;
    inputKind?: 'text' | 'number';
  }
): VVSNode {
  const inputKind = options.inputKind ?? 'text';
  const valueType = inputKind === 'number' ? 'data_number' : 'data_string';
  const kindLabel = inputKind === 'number' ? 'Number' : 'Text';

  return usabilityTestNode(id, position, {
    label: `Get User Input · ${kindLabel}`,
    category: 'Action',
    kindId: 'action_get_input',
    inputs: [EXEC_IN, { id: 'prompt', label: 'Prompt', type: 'data_string' }],
    outputs: [
      EXEC_OUT,
      { id: 'value', label: 'Value', type: valueType },
    ],
    inlineValues: { prompt: options.prompt },
    properties: { inputKind },
  });
}

export function convertToStringNode(id: string, position: { x: number; y: number }): VVSNode {
  return usabilityTestNode(id, position, {
    label: 'To String',
    category: 'Conversion',
    kindId: 'convert_to_string',
    inputs: [{ id: 'value', label: 'Value', type: 'data_any' }],
    outputs: [{ id: 'result', label: 'String', type: 'data_string' }],
    inlineValues: {},
  });
}

export function convertToNumberNode(id: string, position: { x: number; y: number }): VVSNode {
  return usabilityTestNode(id, position, {
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
  return usabilityTestNode(id, position, data);
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
  return usabilityTestNode(id, position, applyFunctionCallBinding(empty, func));
}

export function boundImportClass(
  id: string,
  position: { x: number; y: number },
  cls: ClassSymbol,
  options?: { alias?: string }
): VVSNode {
  return usabilityTestNode(id, position, {
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
  return usabilityTestNode(id, position, applyEventDefineBinding(empty, event));
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
  return usabilityTestNode(id, position, applyEventDispatchBinding(empty, event));
}

export function functionEntryNode(
  id: string,
  position: { x: number; y: number },
  func: FunctionSymbol
): VVSNode {
  return usabilityTestNode(id, position, {
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
  return usabilityTestNode(id, position, {
    label: `Declare ${cls.name}`,
    category: 'Project',
    kindId: 'class_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    properties: {
      symbolId: cls.id,
      classId: cls.id,
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
  return usabilityTestNode(id, position, {
    label: `Declare ${variable.name}`,
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
      visibility: variable.visibility,
      isConst: !!variable.flags?.readonly,
      variableName: variable.name,
      ...(variable.enumType ? { enumType: variable.enumType } : {}),
      ...(variable.typeRef ? { typeRef: variable.typeRef } : {}),
    },
  });
}

export function functionDefineNode(
  id: string,
  position: { x: number; y: number },
  func: FunctionSymbol
): VVSNode {
  const overload = func.overloads[0];
  return usabilityTestNode(id, position, {
    label: `Declare ${func.name}`,
    category: 'Project',
    kindId: 'function_define',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    inlineValues: {},
    linkedGraphId: func.id,
    graphBinding: { kind: 'call_function', symbolId: func.id, overloadId: overload?.id },
    properties: {
      symbolId: func.id,
      name: func.name,
      binding: func.binding,
      visibility: func.visibility,
      isAbstract: !!func.flags?.abstract,
      isVirtual: !!func.flags?.virtual,
      isOverride: !!func.flags?.override,
      isAsync: !!func.flags?.async,
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
  return usabilityTestNode(id, position, {
    label: `Declare ${event.name}`,
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
  return usabilityTestNode(id, position, buildGraphRefNodeData(options));
}
