import { csharpGroupDeclarations } from './csharpDeclarationGroups';
import { csharpIntegerAssignable, csharpIntegerBinary, csharpIntegerConvert, CSharpIntegerError, type CSharpIntegerFact, type CSharpIntegerType, type CSharpIntegerOperator, type CSharpOverflowContext } from './csharpIntegerSemantics';
import { inferCSharpGraphExpression, CSharpGraphExpressionError, type CSharpGraphLocalBinding } from './csharpGraphExpressions';
import { CSHARP_INTEGRAL_PINS, validCSharpBindingName, type NativeParameter } from './nativeSignatures';
import type { GraphDocument } from './symbols';

export type CSharpLocalStyle = 'csharp-typed' | 'csharp-var' | 'csharp-const';
/** Inspector edits change authored spelling and readonly identity together.
 * Leaving var requires its graph-derived type; never guess a default width.
 * The normal analyzer still checks constant eligibility and downstream reads.
 */
export function csharpLocalStylePatch(properties: Record<string, unknown>, style: CSharpLocalStyle, inferredType?: CSharpIntegerType) {
  if (!['csharp-typed', 'csharp-var', 'csharp-const'].includes(style) || !String(properties.nativeLocalStyle).startsWith('csharp-')) throw new CSharpGraphExpressionError('LOCAL_STYLE');
  const nativeType = style === 'csharp-var' ? 'var' : properties.nativeType === 'var' ? inferredType : properties.nativeType;
  if (nativeType !== 'var' && (typeof nativeType !== 'string' || !Object.hasOwn(CSHARP_INTEGRAL_PINS, nativeType))) throw new CSharpGraphExpressionError('LOCAL_TYPE');
  return { nativeLocalStyle: style, nativeType, isConst: style === 'csharp-const', declarationKind: style === 'csharp-const' ? 'const' : 'var' };
}

/** Shared source/graph initialization policy. Mutable reads are never constants. */
export function csharpIntegralLocal(type: CSharpIntegerType | 'var', isConst: boolean, initializer: CSharpIntegerFact) {
  if (isConst && type === 'var') throw new CSharpIntegerError('CONST_VAR');
  const declaredType = type === 'var' ? initializer.type : type;
  const converted = csharpIntegerAssignable(initializer, declaredType);
  if (isConst && converted.constant === undefined) throw new CSharpIntegerError('CONST_INITIALIZER');
  return { declaredType, converted, read: isConst ? converted : { type: declaredType } as CSharpIntegerFact };
}

/** Reassignment uses native implicit assignment, never an implicit cast. */
export function csharpIntegralAssignment(type: CSharpIntegerType, readonly: boolean, value: CSharpIntegerFact) {
  if (readonly) throw new CSharpIntegerError('ASSIGN_READONLY');
  return csharpIntegerAssignable(value, type);
}

export const CSHARP_ASSIGNMENT_OPERATORS = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '++', '--'] as const;
export type CSharpAssignmentOperator = typeof CSHARP_ASSIGNMENT_OPERATORS[number];
/** Predefined compound assignment permits an explicit result conversion only
 * when the RHS implicitly converts to the target, with a shift exception.
 * A mutable target is not a constant, even if its last initializer was one.
 */
export function csharpIntegralMutation(type: CSharpIntegerType, readonly: boolean, operator: string, value?: CSharpIntegerFact, context: CSharpOverflowContext = 'default'): CSharpIntegerFact {
  if (readonly) throw new CSharpIntegerError('ASSIGN_READONLY');
  if (!CSHARP_ASSIGNMENT_OPERATORS.includes(operator as CSharpAssignmentOperator)) throw new CSharpIntegerError('ASSIGN_OPERATOR');
  csharpIntegerAssignable({ type }, type);
  if (operator === '++' || operator === '--') {
    if (value) throw new CSharpIntegerError('UPDATE_VALUE');
    return { type };
  }
  if (!value) throw new CSharpIntegerError('ASSIGN_VALUE');
  if (operator === '=') return csharpIntegralAssignment(type, readonly, value);
  const binary = operator.slice(0, -1) as CSharpIntegerOperator;
  const result = csharpIntegerBinary(binary, { type }, value, context);
  try { return csharpIntegerAssignable(result, type); }
  catch (error) {
    if (!(error instanceof CSharpIntegerError) || error.message !== 'NATIVE_CSHARP_INTEGER_ASSIGNMENT') throw error;
  }
  if (!['<<', '>>', '>>>'].includes(binary)) csharpIntegerAssignable(value, type);
  return csharpIntegerConvert(result, type, context);
}

/** Graph-owned facts for initialized locals in lexical execution regions. Method admission
 * separately validates native IR/printing and declaration/index ownership.
 */
function walkCSharpLocals(doc: GraphDocument, signature: NativeParameter[], entryId: string, stopAfter?: string, allowFallthrough = false) {
  const entry = doc.nodes.find(node => node.id === entryId);
  if (entry?.data.kindId !== 'function_entry' || entry.data.properties?.nativeSignatureLanguage !== 'csharp' || signature.some(parameter => !validCSharpBindingName(parameter.name) || !Object.hasOwn(CSHARP_INTEGRAL_PINS, String(parameter.nativeType)))) throw new CSharpGraphExpressionError('LOCAL_ENTRY');
  const visited = new Set<string>();
  const statements: string[] = [];
  const active = new Set<string>([entryId]);
  const declaredIds = new Set<string>();
  type WalkResult = { bindings: Map<string, CSharpGraphLocalBinding>; visited: Set<string>; statements: string[]; returnId: string | undefined; overflowContext: CSharpOverflowContext; stopped?: boolean };
  const walk = (start: string, handle: string, bindings: Map<string, CSharpGraphLocalBinding>, ancestors: Set<string>, context: CSharpOverflowContext, ownerId?: string, fallthrough = true, groupId?: string): WalkResult => {
    const names = new Set(ancestors), reserved = new Set(ancestors);
    const ownNames = new Set<string>(), scan = new Set<string>();
    let scanId = start, scanHandle = handle;
    for (;;) {
      const edges = doc.edges.filter(edge => edge.source === scanId && edge.sourceHandle === scanHandle && edge.data?.pinType === 'execution');
      if (!edges.length) break;
      if (edges.length !== 1 || scan.has(edges[0].target) || scan.size >= 256) throw new CSharpGraphExpressionError('LOCAL_FLOW');
      scanId = edges[0].target; scanHandle = 'exec_out'; scan.add(scanId);
      const candidate = doc.nodes.find(node => node.id === scanId);
      const candidates = candidate?.data.kindId === 'csharp_declaration_group' ? csharpGroupDeclarations(doc, candidate.id) : candidate ? [candidate] : [];
      for (const declaration of candidates.filter(node => node.data.kindId === 'var_define')) {
        const name = String(declaration.data.properties?.name ?? '').replace(/^@/, '');
        if (ownNames.has(name) || ancestors.has(name)) throw new CSharpGraphExpressionError('LOCAL_BINDING');
        ownNames.add(name); reserved.add(name);
      }
    }
    let current = start, output = handle;
  for (;;) {
    const edges = doc.edges.filter(edge => edge.source === current && edge.sourceHandle === output && edge.data?.pinType === 'execution');
    if (edges.length === 0 && fallthrough) return { bindings, visited, statements, returnId: undefined, overflowContext: context };
    if (edges.length !== 1 || edges[0].sourceHandle !== output || edges[0].targetHandle !== 'exec_in') throw new CSharpGraphExpressionError('LOCAL_FLOW');
    const id = edges[0].target;
    if (active.has(id) || active.size >= 256) throw new CSharpGraphExpressionError('LOCAL_FLOW');
    const node = doc.nodes.find(node => node.id === id);
    if (!node || doc.edges.filter(edge => edge.target === id && edge.data?.pinType === 'execution').length !== 1) throw new CSharpGraphExpressionError('LOCAL_FLOW');
    if (groupId && node.data.kindId !== 'var_define') throw new CSharpGraphExpressionError('GROUP_DECLARATOR');
    if (node.data.kindId === 'csharp_declaration_group') {
      const properties = node.data.properties ?? {};
      if (!Object.hasOwn(CSHARP_INTEGRAL_PINS, String(properties.nativeType)) || !['typed', 'const'].includes(String(properties.groupStyle)) || Object.keys(node.data.inlineValues ?? {}).length || node.data.inputs.length !== 1 || node.data.inputs[0].id !== 'exec_in' || node.data.inputs[0].type !== 'execution' || node.data.outputs.length !== 2 || !['declarations_exec', 'exec_out'].every(handle => node.data.outputs.some(pin => pin.id === handle && pin.type === 'execution')) || doc.edges.some(edge => edge.source === id && edge.data?.pinType === 'execution' && !['declarations_exec', 'exec_out'].includes(String(edge.sourceHandle)))) throw new CSharpGraphExpressionError('GROUP_PINS');
      const declarations = csharpGroupDeclarations(doc, id);
      if (declarations.some(declaration => declaration.data.properties?.nativeType !== properties.nativeType || declaration.data.properties?.nativeLocalStyle !== (properties.groupStyle === 'const' ? 'csharp-const' : 'csharp-typed'))) throw new CSharpGraphExpressionError('GROUP_TYPE');
      active.add(id); statements.push(id); visited.add(id);
      const child = walk(id, 'declarations_exec', bindings, names, context, ownerId, true, id);
      if (child.stopped) return child;
      for (const declaration of declarations) names.add(String(declaration.data.properties?.name).replace(/^@/, ''));
      current = id; output = 'exec_out'; continue;
    }
    if (node.data.kindId === 'flow_return') {
      if (doc.edges.some(edge => edge.source === id && edge.data?.pinType === 'execution')) throw new CSharpGraphExpressionError('LOCAL_FLOW');
      active.add(id); return { bindings, visited, statements, returnId: id, overflowContext: context };
    }
    if (node.data.kindId === 'csharp_scope') {
      const overflow = node.data.properties?.overflowContext;
      if (!['default', 'checked', 'unchecked'].includes(String(overflow)) || Object.keys(node.data.inlineValues ?? {}).length || node.data.inputs.length !== 1 || node.data.inputs[0].id !== 'exec_in' || node.data.inputs[0].type !== 'execution' || node.data.outputs.length !== 2 || !['body_exec', 'exec_out'].every(handle => node.data.outputs.some(pin => pin.id === handle && pin.type === 'execution')) || doc.edges.some(edge => edge.source === id && edge.data?.pinType === 'execution' && !['body_exec', 'exec_out'].includes(String(edge.sourceHandle)))) throw new CSharpGraphExpressionError('SCOPE_PINS');
      active.add(id); statements.push(id); visited.add(id);
      const child = walk(id, 'body_exec', new Map(bindings), reserved, overflow === 'default' ? context : overflow as CSharpOverflowContext, id);
      if (child.returnId || child.stopped) {
        if (child.returnId && doc.edges.some(edge => edge.source === id && edge.sourceHandle === 'exec_out' && edge.data?.pinType === 'execution')) throw new CSharpGraphExpressionError('SCOPE_UNREACHABLE');
        return child;
      }
      for (const symbolId of bindings.keys()) if (child.bindings.has(symbolId)) bindings.set(symbolId, child.bindings.get(symbolId)!);
      current = id; output = 'exec_out'; continue;
    }
    if (doc.edges.some(edge => edge.source === id && edge.data?.pinType === 'execution' && edge.sourceHandle !== 'exec_out')) throw new CSharpGraphExpressionError('LOCAL_FLOW');
    if (node.data.kindId === 'variable_set' || node.data.kindId === 'parameter_set') {
      const properties = node.data.properties ?? {};
      const symbolId = node.data.graphBinding?.symbolId ?? properties.symbolId;
      const binding = typeof symbolId === 'string' ? bindings.get(symbolId) : undefined;
      const declaration = binding && doc.nodes.find(item => item.id === binding.definitionId);
      const parameter = node.data.kindId === 'parameter_set' ? signature.find(parameter => parameter.id === node.data.graphBinding?.parameterId) : undefined;
      if (node.data.kindId === 'parameter_set') {
        if (!parameter || node.data.graphBinding?.kind !== 'parameter_ref' || symbolId !== entry.data.graphBinding?.symbolId || node.data.graphBinding?.overloadId !== entry.data.graphBinding?.overloadId || properties.functionId !== symbolId || properties.overloadId !== node.data.graphBinding?.overloadId || properties.parameterId !== parameter.id || properties.parameterName !== parameter.name) throw new CSharpGraphExpressionError('PARAMETER_ASSIGNMENT_BINDING');
      } else if (!binding || node.data.graphBinding?.kind !== 'variable_ref' || properties.symbolId !== symbolId || properties.variableName !== binding.name) throw new CSharpGraphExpressionError('LOCAL_ASSIGNMENT_BINDING');
      const operator = String(properties.assignmentOperator ?? '=');
      const update = operator === '++' || operator === '--';
      if (binding?.initialized === false && operator !== '=') throw new CSharpGraphExpressionError('LOCAL_NOT_INITIALIZED');
      if (!CSHARP_ASSIGNMENT_OPERATORS.includes(operator as CSharpAssignmentOperator) || properties.prefix !== undefined && typeof properties.prefix !== 'boolean' || !update && properties.prefix === true) throw new CSharpGraphExpressionError('LOCAL_ASSIGNMENT_OPERATOR');
      if (node.data.inputs.length !== (update ? 1 : 2) || !node.data.inputs.some(pin => pin.id === 'exec_in' && pin.type === 'execution') || !update && !node.data.inputs.some(pin => pin.id === 'val' && pin.type === 'data_number') || node.data.outputs.length !== 1 || node.data.outputs[0].id !== 'exec_out' || node.data.outputs[0].type !== 'execution' || Object.keys(node.data.inlineValues ?? {}).length) throw new CSharpGraphExpressionError('LOCAL_ASSIGNMENT_PINS');
      const values = doc.edges.filter(edge => edge.target === id && edge.targetHandle === 'val');
      if (update ? values.length !== 0 : values.length !== 1 || !values[0].sourceHandle) throw new CSharpGraphExpressionError('LOCAL_ASSIGNMENT_VALUE');
      const fact = update ? undefined : inferCSharpGraphExpression(doc, signature, entryId, values[0].source, values[0].sourceHandle!, context, visited, new Set(), bindings);
      csharpIntegralMutation(parameter ? parameter.nativeType as CSharpIntegerType : binding!.fact.type, declaration?.data.properties?.nativeLocalStyle === 'csharp-const', operator, fact, context);
      if (!parameter && binding && typeof symbolId === 'string') bindings.set(symbolId, { ...binding, initialized: true });
      active.add(id); statements.push(id); visited.add(id); current = id; output = 'exec_out';
      continue;
    }
    if (node.data.kindId !== 'var_define') throw new CSharpGraphExpressionError('LOCAL_STATEMENT');
    active.add(id); statements.push(id);
    const properties = node.data.properties ?? {};
    const style = properties.nativeLocalStyle;
    if (!['csharp-typed', 'csharp-var', 'csharp-const'].includes(String(style))) throw new CSharpGraphExpressionError('LOCAL_STYLE');
    const isConst = style === 'csharp-const';
    if (isConst ? properties.isConst !== true || properties.declarationKind !== 'const' : properties.isConst === true || properties.declarationKind === 'const') throw new CSharpGraphExpressionError('LOCAL_READONLY');
    const name = properties.name;
    const symbolId = properties.symbolId;
    if (properties.groupOwnerId !== groupId) throw new CSharpGraphExpressionError('GROUP_OWNER');
    if (properties.scopeOwnerId !== ownerId) throw new CSharpGraphExpressionError('LOCAL_SCOPE_OWNER');
    if (typeof name !== 'string' || !validCSharpBindingName(name) || typeof symbolId !== 'string' || !symbolId || declaredIds.has(symbolId) || names.has(name.replace(/^@/, ''))) throw new CSharpGraphExpressionError('LOCAL_BINDING');
    const type = properties.nativeType;
    if (style === 'csharp-var' ? type !== 'var' : typeof type !== 'string' || !Object.hasOwn(CSHARP_INTEGRAL_PINS, type)) throw new CSharpGraphExpressionError('LOCAL_TYPE');
    const values = doc.edges.filter(edge => edge.target === id && edge.targetHandle === 'value');
    const initialized = properties.hasInitializer === true;
    if (typeof properties.hasInitializer !== 'boolean' || Object.keys(node.data.inlineValues ?? {}).length || (initialized ? values.length !== 1 || !values[0].sourceHandle || !node.data.inputs.some(pin => pin.id === 'value' && pin.type === 'data_number') : values.length !== 0 || node.data.inputs.some(pin => pin.id === 'value') || style !== 'csharp-typed')) throw new CSharpGraphExpressionError('LOCAL_INITIALIZER');
    const local = initialized
      ? csharpIntegralLocal(type as CSharpIntegerType | 'var', isConst, inferCSharpGraphExpression(doc, signature, entryId, values[0].source, values[0].sourceHandle!, context, visited, new Set(), bindings))
      : { read: { type: type as CSharpIntegerType } };
    declaredIds.add(symbolId); bindings.set(symbolId, { name, definitionId: id, fact: local.read, initialized });
    names.add(name.replace(/^@/, '')); visited.add(id); current = id; output = 'exec_out';
    if (id === stopAfter) return { bindings, visited, statements, returnId: undefined, overflowContext: context, stopped: true };
  }
  };
  return walk(entryId, 'exec_out', new Map(), new Set(signature.map(parameter => parameter.name.replace(/^@/, ''))), 'default', undefined, allowFallthrough);
}

type CSharpLocalWalk = ReturnType<typeof walkCSharpLocals>;
export function inferCSharpLinearLocals(doc: GraphDocument, signature: NativeParameter[], entryId: string, allowFallthrough?: false): CSharpLocalWalk & { returnId: string };
export function inferCSharpLinearLocals(doc: GraphDocument, signature: NativeParameter[], entryId: string, allowFallthrough: boolean): CSharpLocalWalk;
export function inferCSharpLinearLocals(doc: GraphDocument, signature: NativeParameter[], entryId: string, allowFallthrough = false): CSharpLocalWalk {
  const result = walkCSharpLocals(doc, signature, entryId, undefined, allowFallthrough);
  if (!result.returnId && !allowFallthrough) throw new CSharpGraphExpressionError('LOCAL_FLOW');
  return result;
}

/** Inspector inference stops at the edited declaration so a later invalid
 * assignment cannot prevent repairing this binding. */
export function inferCSharpLocalForEdit(doc: GraphDocument, signature: NativeParameter[], entryId: string, declarationId: string) {
  const result = walkCSharpLocals(doc, signature, entryId, declarationId);
  const binding = [...result.bindings.values()].find(item => item.definitionId === declarationId);
  if (!binding) throw new CSharpGraphExpressionError('LOCAL_BINDING');
  return binding.fact;
}
