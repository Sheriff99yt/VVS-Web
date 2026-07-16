import type { GraphNode, GraphEdge, ProjectEventDefinition, ClassSymbol, FunctionSymbol } from '@vvs/graph-types';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { buildExecutionOrder, findAllExecutionHeads } from '../analyze/graphOrder';
import { getInputKind, inputTempVarName } from '../inputHelpers';
import {
  binaryOpIr,
  getInputTempIr,
  instanceRefIr,
  isConvertKindId,
  literalIr,
  nullIr,
  toNumberIrExpr,
  toStringIrExpr,
} from '../convertExprs';
import {
  getNodeKindDefinition,
  getVariableName,
  normalizeNodeData,
  resolveNodeKindId,
  eventHandlerName,
  parameterCodegenName,
  resolveEventForNode,
} from '../nodeHelpers';
import type { CodegenContext } from '../generate';
import { buildIrMembers, resolveActiveClass, type BuildMembersResult } from './buildMembers';
import type {
  IrEventHandler,
  IrExpr,
  IrModule,
  IrStatement,
  IrStmtKind,
  IrStructuredStatement,
  IrSwitchCase,
} from '../ir/types';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { resolveCodegenTarget } from '@vvs/graph-types';

interface LowerContext {
  nodes: GraphNode[];
  edges: GraphEdge[];
  functions: FunctionSymbol[];
  projectEvents: ProjectEventDefinition[];
  environmentManifest?: ProjectEnvironmentManifest;
  classes?: ClassSymbol[];
  activeClassId?: string;
  projectModuleName?: string;
  variables: import('@vvs/graph-types').VariableSymbol[];
}

function isImportClassNode(node: GraphNode): boolean {
  const kindId = resolveNodeKindId(node.data);
  return kindId === 'import_class' || node.data.graphBinding?.kind === 'import_class';
}

function isImportNode(node: GraphNode): boolean {
  const kindId = resolveNodeKindId(node.data);
  return (
    kindId === 'vvs.project.import_module' ||
    kindId.startsWith('import_module_') ||
    node.data.linkKind === 'import_module' ||
    isImportClassNode(node)
  );
}

function waitSeconds(node: GraphNode): string {
  const s = node.data.properties?.seconds;
  if (typeof s === 'number') return String(s);
  if (typeof s === 'string' && s.trim()) return s;
  return '1';
}

function eventKeyForNode(
  node: GraphNode,
  projectEvents: ProjectEventDefinition[]
): string {
  const eventDef = resolveEventForNode(node.data, projectEvents);
  if (eventDef) return eventHandlerName(eventDef.name);
  const eventName = node.data.properties?.eventName;
  if (typeof eventName === 'string' && eventName.trim()) {
    return eventHandlerName(eventName);
  }
  return handlerNameFromEventNode(node, projectEvents);
}

function isCodegenNode(node: GraphNode): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  if (resolveNodeKindId(node.data) === 'graph_ref') return false;
  return true;
}

function getDataEdgeToPin(
  edges: GraphEdge[],
  nodeId: string,
  pinId: string
): GraphEdge | undefined {
  return edges.find(
    (e) =>
      e.target === nodeId &&
      e.targetHandle === pinId &&
      e.data?.pinType !== 'execution'
  );
}

function firstInputPinId(node: GraphNode, candidates: string[]): string | undefined {
  const inputs = node.data.inputs ?? [];
  for (const id of candidates) {
    if (inputs.some((p) => p.id === id)) return id;
  }
  return inputs.find((p) => p.type !== 'execution')?.id;
}

function resolveFunctionName(
  linkedGraphId: string,
  functions: FunctionSymbol[]
): string {
  return functions.find((f) => f.id === linkedGraphId)?.name ?? linkedGraphId;
}

function mathOpFromKindId(kindId: string): string | null {
  const def = getNodeKindDefinition(kindId);
  return def?.mathOp ?? null;
}

function resolveNodeOutputExpr(
  node: GraphNode,
  pinId: string,
  ctx: LowerContext,
  depth: number
): IrExpr {
  const { nodes, edges } = ctx;
  const kindId = resolveNodeKindId(node.data);
  const varName = getVariableName(node.data);

  if (kindId === 'variable_get' && varName) {
    const symbol = ctx.variables.find((v) => v.name === varName);
    if (symbol?.graphTabId || symbol?.scopedNodeId) {
      return { kind: 'LocalRef', sourceGraphNodeId: node.id, name: varName };
    }
    return instanceRefIr(node.id, varName);
  }

  if (kindId === 'action_get_input' && pinId === 'value') {
    return getInputTempIr(node.id, inputTempVarName(node.id));
  }

  if (kindId === 'flow_for' && pinId === 'index') {
    return { kind: 'LocalRef', sourceGraphNodeId: node.id, name: forIndexVarName(node.id) };
  }

  if (kindId === 'flow_for' && pinId === 'element') {
    return { kind: 'LocalRef', sourceGraphNodeId: node.id, name: forElementVarName(node.id) };
  }

  if (kindId === 'string_concat' && pinId === 'result') {
    const a = resolvePinValueExpr(node, 'a', ctx, depth + 1);
    const b = resolvePinValueExpr(node, 'b', ctx, depth + 1);
    return binaryOpIr(node.id, '+', a, b);
  }

  if (kindId === 'convert_to_string' && pinId === 'result') {
    const inner = resolvePinValueExpr(node, 'value', ctx, depth + 1);
    return toStringIrExpr(node.id, inner);
  }

  if (kindId === 'convert_to_number' && pinId === 'result') {
    const inner = resolvePinValueExpr(node, 'value', ctx, depth + 1);
    return toNumberIrExpr(node.id, inner);
  }

  if (kindId === 'expr_enum_member' && (pinId === 'val' || pinId === 'result' || !pinId)) {
    const enumName =
      typeof node.data.properties?.enumName === 'string' ? node.data.properties.enumName.trim() : '';
    const member =
      typeof node.data.properties?.member === 'string' ? node.data.properties.member.trim() : '';
    if (enumName && member) {
      return { kind: 'EnumMember', sourceGraphNodeId: node.id, enumName, member };
    }
  }

  const mathOp = mathOpFromKindId(kindId);
  if (mathOp) {
    const aPin = firstInputPinId(node, ['a', 'in_a']) ?? 'a';
    const bPin = firstInputPinId(node, ['b', 'in_b']) ?? 'b';
    const a = resolvePinValueExpr(node, aPin, ctx, depth);
    const b = resolvePinValueExpr(node, bPin, ctx, depth);
    const op =
      mathOp === 'add' ? '+' : mathOp === 'subtract' ? '-' : mathOp === 'multiply' ? '*' : '/';
    return binaryOpIr(node.id, op, a, b);
  }

  if (node.data.category === 'Events') {
    const pin = node.data.outputs?.find((p) => p.id === pinId);
    const text = pin?.label ? pin.label.replace(/\s+/g, '_').toLowerCase() : 'event_value';
    return literalIr(node.id, text, 'raw');
  }

  return literalIr(node.id, `/* ${node.data.label}.${pinId} */`, 'string');
}

function resolvePinValueExpr(
  node: GraphNode,
  pinId: string,
  ctx: LowerContext,
  depth = 0
): IrExpr {
  if (depth > 8) return literalIr(node.id, '/* cycle */', 'string');

  const { nodes, edges } = ctx;
  const edge = getDataEdgeToPin(edges, node.id, pinId);
  if (edge) {
    const source = nodes.find((n) => n.id === edge.source);
    if (!source || source.type !== 'vvs_standard_node') {
      return nullIr(node.id);
    }
    return resolveNodeOutputExpr(source, edge.sourceHandle ?? '', ctx, depth + 1);
  }

  const inline = node.data.inlineValues?.[pinId];
  if (inline !== undefined) {
    if (typeof inline === 'string') return literalIr(node.id, inline, 'string');
    if (typeof inline === 'boolean') return literalIr(node.id, inline, 'boolean');
    if (typeof inline === 'number') return literalIr(node.id, inline, 'number');
    return literalIr(node.id, String(inline), 'string');
  }

  return nullIr(node.id);
}

function moduleSlugFromImportNode(node: GraphNode): string {
  const fromProps = node.data.properties?.modulePath;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  const label = node.data.label.replace(/^Import\s+/, '').trim();
  return label.replace(/\s+/g, '_').toLowerCase() || 'module';
}

function importStyleFromNode(node: GraphNode): 'module' | 'from' | 'include_system' {
  const style = node.data.properties?.importStyle;
  if (style === 'from' || style === 'include_system' || style === 'module') return style;
  // Heuristic: named imports imply `from`
  const names = node.data.properties?.importNames;
  if (typeof names === 'string' && names.trim()) return 'from';
  return 'module';
}

function importNamesFromNode(node: GraphNode): string[] | undefined {
  const raw = node.data.properties?.importNames;
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function targetLanguagesFromNode(node: GraphNode): string[] | undefined {
  const raw = node.data.properties?.targetLanguages;
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const list = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : undefined;
}

function resolveClassModuleName(cls: ClassSymbol, projectModuleName?: string): string {
  if (cls.id === MAIN_CLASS_ID && projectModuleName?.trim()) return projectModuleName;
  return cls.name;
}

function targetClassIdFromNode(node: GraphNode): string | undefined {
  const fromProps = node.data.properties?.targetClassId;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps;
  const fromBinding = node.data.graphBinding?.targetClassId;
  if (typeof fromBinding === 'string' && fromBinding.trim()) return fromBinding;
  return undefined;
}

function importAliasFromNode(node: GraphNode): string | undefined {
  const alias = node.data.properties?.alias;
  return typeof alias === 'string' && alias.trim() ? alias.trim() : undefined;
}

function followExecFromHandle(
  nodeId: string,
  sourceHandle: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): string[] {
  const edge = edges.find(
    (e) =>
      e.source === nodeId &&
      e.sourceHandle === sourceHandle &&
      e.data?.pinType === 'execution'
  );
  if (!edge) return [];
  return buildExecutionOrder(edge.target, nodes, edges);
}

function forIndexVarName(nodeId: string): string {
  return `_vvs_i_${nodeId.replace(/-/g, '_')}`;
}

function forElementVarName(nodeId: string): string {
  return `val`;
}

function flowForIsForEach(node: GraphNode): boolean {
  return (node.data.inputs ?? []).some((p) => p.id === 'array');
}

function switchCaseLabel(node: GraphNode, caseIndex: number): string {
  const key = `case${caseIndex}`;
  const prop = node.data.properties?.[key];
  if (typeof prop === 'string' && prop.trim()) return prop;
  if (typeof prop === 'number') return String(prop);
  return String(caseIndex);
}

/** Structured enum case: switch.enumType + caseN member name, or legacy Enum::Member. */
function switchCaseRef(
  node: GraphNode,
  caseIndex: number
): { label: string; enumName?: string; member?: string } {
  const label = switchCaseLabel(node, caseIndex);
  const enumTypeProp = node.data.properties?.enumType;
  const enumType =
    typeof enumTypeProp === 'string' && enumTypeProp.trim() ? enumTypeProp.trim() : undefined;

  const legacy = /^([A-Za-z_][\w]*)::([A-Za-z_][\w]*)$/.exec(label.trim());
  if (legacy) {
    return { label, enumName: legacy[1], member: legacy[2] };
  }
  if (enumType && /^[A-Za-z_][\w]*$/.test(label.trim())) {
    return { label, enumName: enumType, member: label.trim() };
  }
  return { label };
}

const CONTROL_FLOW_KINDS = new Set([
  'flow_branch',
  'flow_for',
  'flow_while',
  'flow_switch',
  'flow_sequence',
]);

function collectBranchDescendantIds(branchNodeId: string, nodes: GraphNode[], edges: GraphEdge[]): Set<string> {
  const node = nodes.find((n) => n.id === branchNodeId);
  if (!node) return new Set();
  
  const ids = new Set<string>();
  
  const branchHandles = (node.data.outputs || [])
    .filter(p => p.type === 'execution' && p.id !== 'exec')
    .map(p => p.id);

  for (const handle of branchHandles) {
    followExecFromHandle(branchNodeId, handle, nodes, edges).forEach((id) => ids.add(id));
  }
  return ids;
}

function stmtKindForNode(node: GraphNode): IrStmtKind | null {
  const kindId = resolveNodeKindId(node.data);

  if (isImportNode(node)) return 'ModuleImport';
  if (
    kindId === 'vvs.project.call_function' ||
    kindId.startsWith('call_function_') ||
    node.data.linkKind === 'call_function' ||
    node.data.graphBinding?.kind === 'call_function' ||
    kindId.startsWith('use_macro_') ||
    node.data.linkKind === 'use_macro' ||
    kindId === 'vvs.project.use_macro'
  ) {
    return 'CallFunction';
  }
  if (kindId === 'event_dispatch' || kindId === 'event_emit') return 'DispatchEvent';
  if (kindId === 'action_wait' || kindId === 'action_await_wait') return 'AwaitWait';
  if (kindId === 'flow_branch') return 'IfBranch';
  if (kindId === 'flow_for') return 'ForLoop';
  if (kindId === 'flow_while') return 'WhileLoop';
  if (kindId === 'flow_switch') return 'Switch';
  if (kindId === 'flow_sequence') return 'Sequence';
  if (kindId === 'action_print') return 'Print';
  if (kindId === 'env.call_native') return 'CallNative';
  if (kindId === 'action_get_input' || kindId === 'variable_set') return 'AssignVariable';
  return null;
}

function commentFallback(nodeId: string, kind: IrStmtKind, comment: string): IrStructuredStatement {
  return { kind: 'CommentFallback', intendedKind: kind, sourceGraphNodeId: nodeId, comment };
}

function lowerStatement(
  node: GraphNode,
  ctx: LowerContext,
  skipIds: Set<string>
): IrStructuredStatement | null {
  const { nodes, edges, functions, projectEvents, environmentManifest } = ctx;
  const kindId = resolveNodeKindId(node.data);
  const irKind = stmtKindForNode(node);

  if (isImportNode(node)) {
    const importNames = importNamesFromNode(node);
    const importStyle = importStyleFromNode(node);
    const label = typeof node.data.label === 'string' ? node.data.label.trim() : '';
    const ownerRaw = node.data.properties?.ownerClassId;
    return {
      kind: 'ModuleImport' as const,
      sourceGraphNodeId: node.id,
      moduleSlug: moduleSlugFromImportNode(node),
      displayLabel: label || undefined,
      importStyle:
        importNames?.length && importStyle === 'module' ? 'from' : importStyle,
      importNames,
      targetLanguages: targetLanguagesFromNode(node),
      ownerClassId:
        typeof ownerRaw === 'string' && ownerRaw.trim() ? ownerRaw.trim() : undefined,
    };
  }

  if (
    kindId === 'event_on_start' ||
    kindId === 'event_on_update' ||
    kindId === 'event_define' ||
    kindId === 'event_member_define' ||
    kindId === 'event_custom' ||
    kindId === 'env.event_handler' ||
    kindId === 'class_define' ||
    kindId === 'function_define' ||
    kindId === 'enum_define' ||
    kindId === 'event_member_define'
  ) {
    return null;
  }

  if (kindId === 'var_define') {
    const varName = getVariableName(node.data);
    if (varName) {
      const symbol = ctx.variables.find((v) => v.name === varName);
      if (symbol?.graphTabId || symbol?.scopedNodeId) {
        return {
          kind: 'DeclareLocal',
          sourceGraphNodeId: node.id,
          name: varName,
          variableType: symbol.type,
          defaultValue: symbol.defaultValue,
        };
      }
    }
    return null;
  }

  if (
    kindId === 'vvs.project.call_function' ||
    kindId.startsWith('call_function_') ||
    node.data.linkKind === 'call_function' ||
    node.data.graphBinding?.kind === 'call_function' ||
    kindId.startsWith('use_macro_') ||
    node.data.linkKind === 'use_macro' ||
    kindId === 'vvs.project.use_macro'
  ) {
    if (!node.data.linkedGraphId && !node.data.graphBinding?.symbolId) {
      return commentFallback(node.id, 'CallFunction', 'call (unlinked)');
    }
    const graphId = node.data.graphBinding?.symbolId ?? node.data.linkedGraphId ?? '';
    const fn = functions.find((f) => f.id === graphId);
    const name = fn?.name ?? resolveFunctionName(graphId, functions);
    const fnClassId = fn?.classId ?? MAIN_CLASS_ID;
    const activeClassId = ctx.activeClassId ?? MAIN_CLASS_ID;
    const crossClass = fnClassId !== activeClassId;
    const targetClass = crossClass ? ctx.classes?.find((c) => c.id === fnClassId) : undefined;
    const activeClass = ctx.classes?.find((c) => c.id === activeClassId);
    const targetClassName = targetClass
      ? resolveClassModuleName(targetClass, ctx.projectModuleName)
      : undefined;
    // Inherited methods on the same instance — do not instantiate the base class.
    const inheritedCall =
      Boolean(crossClass) &&
      Boolean(activeClass?.extendsType) &&
      Boolean(targetClassName) &&
      activeClass!.extendsType === targetClassName;
    const staticCall = fn?.binding === 'static' || fn?.binding === 'module';
    return {
      kind: 'CallFunction',
      sourceGraphNodeId: node.id,
      calleeName: name,
      instanceCall: !staticCall,
      crossClass: crossClass && !inheritedCall,
      targetClassName,
    };
  }

  if (kindId === 'event_dispatch' || kindId === 'event_emit') {
    const eventDef = resolveEventForNode(node.data, projectEvents);
    const handler = eventDef
      ? eventHandlerName(eventDef.name)
      : kindId === 'event_emit'
        ? eventKeyForNode(node, projectEvents)
        : handlerNameFromEventNode(node, projectEvents);
    const paramIds =
      eventDef?.parameters.map((p) => p.id) ??
      node.data.inputs.filter((p) => p.type !== 'execution').map((p) => p.id);
    const args = paramIds.map((pinId) => resolvePinValueExpr(node, pinId, ctx, 0));
    const eventClassId = eventDef?.classId ?? MAIN_CLASS_ID;
    const activeClassId = ctx.activeClassId ?? MAIN_CLASS_ID;
    const crossClass = eventClassId !== activeClassId;
    const targetClass = crossClass ? ctx.classes?.find((c) => c.id === eventClassId) : undefined;
    const activeClass = ctx.classes?.find((c) => c.id === activeClassId);
    const targetClassName = targetClass
      ? resolveClassModuleName(targetClass, ctx.projectModuleName)
      : undefined;
    const inheritedDispatch =
      Boolean(crossClass) &&
      Boolean(activeClass?.extendsType) &&
      Boolean(targetClassName) &&
      activeClass!.extendsType === targetClassName;
    return {
      kind: 'DispatchEvent',
      sourceGraphNodeId: node.id,
      handlerName: handler,
      args,
      crossClass: crossClass && !inheritedDispatch,
      targetClassName,
    };
  }

  if (kindId === 'event_subscribe') {
    return null;
  }

  if (kindId === 'action_wait' || kindId === 'action_await_wait') {
    return {
      kind: 'AwaitWait',
      sourceGraphNodeId: node.id,
      seconds: waitSeconds(node),
      async: kindId === 'action_await_wait',
    };
  }


  if (kindId === 'variable_get' || kindId.startsWith('math_') || isConvertKindId(kindId)) return null;

  if (kindId === 'flow_branch') {
    const condition = resolvePinValueExpr(node, 'condition', ctx, 0);
    const trueOrder = followExecFromHandle(node.id, 'true_exec', nodes, edges);
    const falseOrder = followExecFromHandle(node.id, 'false_exec', nodes, edges);
    const trueBody = buildIrStatements(trueOrder, ctx, new Set());
    const falseBody = buildIrStatements(falseOrder, ctx, new Set());
    return {
      kind: 'IfBranch',
      sourceGraphNodeId: node.id,
      condition,
      trueBody,
      falseBody,
    };
  }

  if (kindId === 'flow_for') {
    if (flowForIsForEach(node)) {
      const collection = resolvePinValueExpr(node, 'array', ctx, 0);
      const bodyOrder = followExecFromHandle(node.id, 'loop_body', nodes, edges);
      const body = buildIrStatements(bodyOrder, ctx, new Set());
      return {
        kind: 'ForEach',
        sourceGraphNodeId: node.id,
        elementVar: forElementVarName(node.id),
        elementType: 'data_number',
        collection,
        body,
      };
    }
    const first = resolvePinValueExpr(node, 'first', ctx, 0);
    const last = resolvePinValueExpr(node, 'last', ctx, 0);
    const bodyOrder = followExecFromHandle(node.id, 'body_exec', nodes, edges);
    const body = buildIrStatements(bodyOrder, ctx, new Set());
    return {
      kind: 'ForLoop',
      sourceGraphNodeId: node.id,
      indexVar: forIndexVarName(node.id),
      first,
      last,
      body,
    };
  }

  if (kindId === 'array_push') {
    const array = resolvePinValueExpr(node, 'array', ctx, 0);
    const value = resolvePinValueExpr(node, 'val', ctx, 0);
    return {
      kind: 'ArrayPush',
      sourceGraphNodeId: node.id,
      array,
      value,
    };
  }

  if (kindId === 'flow_while') {
    const condition = resolvePinValueExpr(node, 'condition', ctx, 0);
    const bodyOrder = followExecFromHandle(node.id, 'body_exec', nodes, edges);
    const body = buildIrStatements(bodyOrder, ctx, new Set());
    return {
      kind: 'WhileLoop',
      sourceGraphNodeId: node.id,
      condition,
      body,
    };
  }

  if (kindId === 'flow_switch') {
    const selector = resolvePinValueExpr(node, 'selector', ctx, 0);
    const cases: IrSwitchCase[] = [];
    
    const outputIds = (node.data.outputs || [])
      .map(o => o.id)
      .filter(id => id.startsWith('case_'));
      
    for (const handle of outputIds) {
      // Find the index (e.g., 'case_2' -> 2)
      const idxStr = handle.replace('case_', '');
      const idx = parseInt(idxStr);
      if (isNaN(idx)) continue;
      
      const caseOrder = followExecFromHandle(node.id, handle, nodes, edges);
      cases.push({
        ...switchCaseRef(node, idx),
        body: buildIrStatements(caseOrder, ctx, new Set()),
      });
    }
    
    const defaultOrder = followExecFromHandle(node.id, 'default_exec', nodes, edges);
    const defaultBody = buildIrStatements(defaultOrder, ctx, new Set());
    return {
      kind: 'Switch',
      sourceGraphNodeId: node.id,
      selector,
      cases,
      defaultBody,
    };
  }

  if (kindId === 'flow_sequence') {
    const steps = ['then_0', 'then_1', 'then_2'].map((handle) => {
      const stepOrder = followExecFromHandle(node.id, handle, nodes, edges);
      return buildIrStatements(stepOrder, ctx, new Set());
    });
    return {
      kind: 'Sequence',
      sourceGraphNodeId: node.id,
      steps,
    };
  }

  if (kindId === 'action_print') {
    const pinId = firstInputPinId(node, ['in_str', 'in_msg', 'in_string']) ?? 'in_str';
    const value = resolvePinValueExpr(node, pinId, ctx, 0);
    return { kind: 'Print', sourceGraphNodeId: node.id, value };
  }

  if (kindId === 'action_get_input') {
    const prompt = resolvePinValueExpr(node, 'prompt', ctx, 0);
    const inputKind = getInputKind(node.data.properties);
    const varName = inputTempVarName(node.id);
    return {
      kind: 'AssignVariable',
      sourceGraphNodeId: node.id,
      assignKind: 'get_input',
      targetName: varName,
      targetBinding: 'local',
      inputKind: inputKind === 'number' ? 'number' : 'text',
      prompt,
    };
  }

  if (kindId === 'variable_set') {
    const varName = getVariableName(node.data);
    if (!varName) return commentFallback(node.id, 'AssignVariable', 'set (no variable)');
    const pinId = firstInputPinId(node, ['val', 'in_val', 'value']);
    const value = pinId ? resolvePinValueExpr(node, pinId, ctx, 0) : nullIr(node.id);
    const symbol = ctx.variables.find((v) => v.name === varName);
    const targetBinding = symbol?.graphTabId || symbol?.scopedNodeId ? 'local' : 'instance';
    return {
      kind: 'AssignVariable',
      sourceGraphNodeId: node.id,
      assignKind: 'variable_set',
      targetName: varName,
      targetBinding,
      value,
    };
  }

  if (kindId === 'env.call_native') {
    const methodId =
      (typeof node.data.properties?.manifestMethodId === 'string'
        ? node.data.properties.manifestMethodId
        : undefined) ?? node.data.graphBinding?.manifestMethodId;
    if (!environmentManifest || !methodId) {
      return commentFallback(node.id, 'CallNative', 'env native (no manifest)');
    }
    const method = environmentManifest.apiSurface.methods.find((m) => m.id === methodId);
    const argExprs: Record<string, IrExpr> = {};
    for (const param of method?.parameters ?? []) {
      argExprs[param.id] = resolvePinValueExpr(node, param.id, ctx, 0);
    }
    return {
      kind: 'CallNative',
      sourceGraphNodeId: node.id,
      manifestMethodId: methodId,
      argExprs,
    };
  }

  const fallbackKind = irKind ?? 'CallFunction';
  return commentFallback(node.id, fallbackKind, node.data.label);
}

export function buildIrStatements(
  order: string[],
  ctx: LowerContext,
  skipIds: Set<string>
): IrStatement[] {
  const { nodes } = ctx;
  const statements: IrStatement[] = [];
  for (const nodeId of order) {
    if (skipIds.has(nodeId)) continue;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !isCodegenNode(node)) continue;

    if (CONTROL_FLOW_KINDS.has(resolveNodeKindId(node.data))) {
      const branchDescendants = collectBranchDescendantIds(node.id, nodes, ctx.edges);
      branchDescendants.forEach((id) => skipIds.add(id));
    }

    const lowered = lowerStatement(node, ctx, skipIds);
    if (lowered) {
      statements.push(lowered);
    }
  }
  return statements;
}



function eventLabelToHandlerName(label: string): string {
  return label.replace(/^On\s+/i, '').toLowerCase().replace(/\s+/g, '_');
}

function handlerNameFromEventNode(node: GraphNode, projectEvents: ProjectEventDefinition[]): string {
  const kindId = resolveNodeKindId(node.data);
  if (kindId === 'event_on_update') return 'update';
  const manifestEventId = node.data.properties?.manifestEventId ?? node.data.graphBinding?.manifestEventId;
  if (typeof manifestEventId === 'string') {
    const eventName = node.data.properties?.eventName;
    if (typeof eventName === 'string' && eventName.trim()) {
      return eventHandlerName(eventName);
    }
  }
  const eventDef = resolveEventForNode(node.data, projectEvents);
  if (eventDef) return eventHandlerName(eventDef.name);
  const eventName = node.data.properties?.eventName;
  if (typeof eventName === 'string' && eventName.trim()) {
    return eventHandlerName(eventName);
  }
  return eventLabelToHandlerName(node.data.label);
}

function handlerParamNames(
  eventNode: GraphNode,
  projectEvents: ProjectEventDefinition[]
): string[] {
  const eventDef = resolveEventForNode(eventNode.data, projectEvents);
  if (eventDef) return eventDef.parameters.map(parameterCodegenName);
  return (eventNode.data.outputs ?? [])
    .filter((p) => p.type !== 'execution')
    .map((p) => parameterCodegenName({ id: p.id, label: p.label, type: p.type }));
}

function irStatementsForGraph(
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  lowerCtx: LowerContext
): IrStatement[] {
  const heads = findAllExecutionHeads(graphNodes, edges);
  const execOrder: string[] = [];
  for (const head of heads) {
    execOrder.push(...buildExecutionOrder(head.id, graphNodes, edges));
  }
  const skipIds = new Set<string>();
  return buildIrStatements(execOrder, { ...lowerCtx, nodes: graphNodes, edges }, skipIds);
}

function buildFunctionBodies(
  documents: Record<string, import('@vvs/graph-types').GraphDocument> | undefined,
  functions: { id: string; name: string }[],
  lowerCtx: LowerContext
): Record<string, IrStatement[]> {
  const bodies: Record<string, IrStatement[]> = {};
  if (!documents) return bodies;
  for (const func of functions) {
    const doc = documents[func.id];
    if (!doc) continue;
    const graphNodes = doc.nodes.filter(isCodegenNode);
    bodies[func.id] = irStatementsForGraph(graphNodes, doc.edges, lowerCtx);
  }
  return bodies;
}

function collectModuleImports(
  allNodes: GraphNode[],
  activeClassId?: string
): IrStatement[] {
  // Honest: every Import Module node emits — no silent dedupe of identical paths.
  const imports: IrStatement[] = [];
  for (const node of allNodes) {
    if (!isCodegenNode(node)) continue;
    if (isImportClassNode(node)) continue;
    if (!isImportNode(node)) continue;
    const ownerRaw = node.data.properties?.ownerClassId;
    const ownerClassId =
      typeof ownerRaw === 'string' && ownerRaw.trim() ? ownerRaw.trim() : undefined;
    if (ownerClassId && activeClassId && ownerClassId !== activeClassId) continue;
    const mod = moduleSlugFromImportNode(node);
    const importStyle = importStyleFromNode(node);
    const importNames = importNamesFromNode(node);
    const targetLanguages = targetLanguagesFromNode(node);
    const label = typeof node.data.label === 'string' ? node.data.label.trim() : '';
    imports.push({
      kind: 'ModuleImport',
      sourceGraphNodeId: node.id,
      moduleSlug: mod,
      displayLabel: label || undefined,
      importStyle,
      importNames,
      targetLanguages,
      ownerClassId,
    });
  }
  return imports;
}

function collectClassImports(
  allNodes: GraphNode[],
  classes: ClassSymbol[] | undefined,
  projectModuleName?: string
): IrStatement[] {
  if (!classes?.length) return [];
  // Honest: every Import Class node emits — no silent dedupe.
  const imports: IrStatement[] = [];
  for (const node of allNodes) {
    if (!isCodegenNode(node) || !isImportClassNode(node)) continue;
    const targetClassId = targetClassIdFromNode(node);
    if (!targetClassId) continue;
    const cls = classes.find((c) => c.id === targetClassId);
    if (!cls) continue;
    const className = cls.name;
    const moduleName = resolveClassModuleName(cls, projectModuleName);
    const alias = importAliasFromNode(node);
    imports.push({
      kind: 'ImportClass',
      sourceGraphNodeId: node.id,
      className,
      moduleName,
      alias,
    });
  }
  return imports;
}

function collectAllCodegenNodes(
  graphNodes: GraphNode[],
  documents: Record<string, import('@vvs/graph-types').GraphDocument> | undefined,
  functions: { id: string; name: string }[]
): GraphNode[] {
  const all = [...graphNodes];
  if (!documents) return all;
  for (const func of functions) {
    const doc = documents[func.id];
    if (!doc) continue;
    all.push(...doc.nodes.filter(isCodegenNode).map((n) => ({ ...n, data: normalizeNodeData(n.data) })));
  }
  return all;
}

import { resolvePrintProfile } from '@vvs/syntax-packs';

/** Body indent for event handler statements (applied at print time). */
export function handlerBodyIndent(family: import('@vvs/graph-types').LanguageFamily): string {
  return resolvePrintProfile(family).layout?.handlerBodyIndent ?? '        ';
}

/** Body indent for on_start / function bodies. */
export function bodyIndent(family: import('@vvs/graph-types').LanguageFamily): string {
  return resolvePrintProfile(family).layout?.bodyIndent ?? '        ';
}

export function graphToIr(ctx: CodegenContext, filePath: string): IrModule {
  const {
    nodes,
    edges,
    targetLanguage,
    variables,
    projectEvents = [],
    functions,
    moduleName,
    extendsType,
    tabLabel,
    tabId,
    documents,
    environmentManifest,
  } = ctx;

  const codegenTarget = ctx.codegenTarget ?? resolveCodegenTarget(targetLanguage) ?? undefined;
  const lowerCtx: LowerContext = {
    nodes: [],
    edges,
    functions,
    projectEvents,
    environmentManifest,
    classes: ctx.classes,
    activeClassId: ctx.activeClassId,
    projectModuleName: ctx.projectModuleName ?? moduleName,
    variables: ctx.variables,
  };

  const activeTabId = tabId ?? 'main';
  const isFunctionTab = activeTabId !== 'main' && functions.some((f) => f.id === activeTabId);

  const graphNodes = nodes
    .filter(isCodegenNode)
    .map((n) => ({ ...n, data: normalizeNodeData(n.data) }));
  const memberBuild = buildIrMembers(ctx, graphNodes, edges, lowerCtx);
  const activeClass = resolveActiveClass(ctx);

  const heads = findAllExecutionHeads(graphNodes, edges);
  const eventHandlers: IrEventHandler[] = [];
  const scriptHeads: GraphNode[] = [];
  let unnamedCount = 0;
  const handlerNodeLabels: string[] = [];

  for (const head of heads) {
    if (head.data.linkedGraphId) continue;
    
    const kindId = resolveNodeKindId(head.data);
    const isEvent = kindId.startsWith('event_') || kindId === 'env.event_handler';

    if (isEvent) {
      const eventDef = resolveEventForNode(head.data, projectEvents);
      if (eventDef && memberBuild.memberEventIds.has(eventDef.id)) {
        continue;
      }
      // Shared home graph: do not emit another class's On handlers into this module.
      if (
        eventDef?.classId &&
        activeClass?.id &&
        eventDef.classId !== activeClass.id
      ) {
        continue;
      }
    }

    if (isEvent) {
      const subOrder = buildExecutionOrder(head.id, graphNodes, edges);
      const subSkip = new Set<string>([head.id]);
      const body = buildIrStatements(
        subOrder,
        { ...lowerCtx, nodes: graphNodes, edges },
        subSkip
      );

      let handlerName = '';
      let paramNames: string[] = [];
      handlerName = handlerNameFromEventNode(head, projectEvents);
      paramNames = handlerParamNames(head, projectEvents);

      eventHandlers.push({
        kind: 'EventHandler' as const,
        sourceGraphNodeId: head.id,
        handlerName,
        paramNames,
        body,
        properties: head.data.properties,
      });
      handlerNodeLabels.push(head.data.label);
    } else {
      if (activeClass?.id === MAIN_CLASS_ID) {
        scriptHeads.push(head);
      }
    }
  }

  const scriptExecOrder: string[] = [];
  for (const head of scriptHeads) {
    scriptExecOrder.push(...buildExecutionOrder(head.id, graphNodes, edges));
  }
  const onStartBody = buildIrStatements(
    scriptExecOrder,
    { ...lowerCtx, nodes: graphNodes, edges },
    new Set<string>()
  );

  const functionBodies = buildFunctionBodies(documents, functions, lowerCtx);
  // Imports on the member chain emit in order via members — only keep orphans in ir.imports.
  // Flow / conditional Import Module nodes emit inside statement bodies — never hoist them.
  const memberImportNodeIds = new Set(
    memberBuild.members
      .filter((m) => m.kind === 'ModuleImport' || m.kind === 'ImportClass')
      .map((m) => m.sourceGraphNodeId)
  );
  const flowImportNodeIds = new Set<string>();
  const collectFlowImportIds = (stmts: IrStatement[]) => {
    for (const stmt of stmts) {
      if (stmt.kind === 'ModuleImport' || stmt.kind === 'ImportClass') {
        flowImportNodeIds.add(stmt.sourceGraphNodeId);
      }
      if (stmt.kind === 'IfBranch') {
        collectFlowImportIds(stmt.trueBody);
        collectFlowImportIds(stmt.falseBody);
      } else if (stmt.kind === 'ForLoop' || stmt.kind === 'ForEach' || stmt.kind === 'WhileLoop') {
        collectFlowImportIds(stmt.body);
      } else if (stmt.kind === 'Switch') {
        for (const c of stmt.cases) collectFlowImportIds(c.body);
        collectFlowImportIds(stmt.defaultBody);
      } else if (stmt.kind === 'Sequence') {
        for (const step of stmt.steps) collectFlowImportIds(step);
      }
    }
  };
  for (const handler of eventHandlers) collectFlowImportIds(handler.body);
  collectFlowImportIds(onStartBody);
  for (const body of Object.values(functionBodies)) collectFlowImportIds(body);

  const allNodes = collectAllCodegenNodes(graphNodes, documents, functions);
  const imports = [
    ...collectModuleImports(allNodes, activeClass?.id),
    ...collectClassImports(allNodes, ctx.classes, ctx.projectModuleName ?? moduleName),
  ].filter(
    (stmt) =>
      !memberImportNodeIds.has(stmt.sourceGraphNodeId) &&
      !flowImportNodeIds.has(stmt.sourceGraphNodeId)
  );

  return {
    moduleName,
    extendsType,
    targetLanguage,
    codegenTarget,
    filePath,
    tabId: activeTabId,
    tabLabel,
    isFunctionTab,
    activeFunction: isFunctionTab ? functions.find((f) => f.id === activeTabId) : undefined,
    variables,
    functions,
    projectEvents,
    documents,
    imports,
    onStartBody,
    eventHandlers,
    functionBodies,
    execOrder: [],
    handlerNodeLabels,
    environmentManifest,
    members: memberBuild.members,
    activeClass,
    emitUnsupportedComments: ctx.emitUnsupportedComments !== false,
  };
}

export { handlerNameFromEventNode };
