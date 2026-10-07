import type { GraphDocument } from './symbols';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { nativeScalarSignaturePin, type NativeScalarFunctionSignature } from './nativeScalarSignatures';
import { nativeScalarLocalBinding, NativeScalarLocalFailure, type NativeScalarLocalBinding } from './nativeScalarLocalBindings';
import { analyzeNativeRuntimeGraph, type NativeRuntimeGraphContext } from './nativeRuntimeGraphs';
import { analyzeNativeConstantGraph } from './nativeConstantGraphs';
import { nativeScalarDeclarationGroup } from './nativeScalarDeclarationGroups';
import { fixedNativeRustInitializer } from './nativeInferredExpressions';

export interface NativeLocalBodyAnalysis {
  readonly statementIds: readonly string[];
  readonly locals: readonly Readonly<NativeScalarLocalBinding>[];
  readonly valueType?: string;
}

/** Called after definition/header/entry ownership checks; every local expression sees its actual flow position. */
export function analyzeNativeLocalFunctionBody(doc: GraphDocument, language: NativeScalarLanguage, context: NativeRuntimeGraphContext, signature: NativeScalarFunctionSignature): Readonly<NativeLocalBodyAnalysis> {
  const fail = (code: string, id: string): never => { throw new NativeScalarLocalFailure(code, id); };
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  const execution = doc.edges.filter(edge => edge.data?.pinType === 'execution');
  const used = new Set([context.entryId]), statements: string[] = [], allLocals: Readonly<NativeScalarLocalBinding>[] = [];
  const visible = new Map<string, Readonly<NativeScalarLocalBinding>>();
  const declaredIds = new Set<string>(), parameterNames = new Set(context.parameters.map(parameter => parameter.name));
  const dynamic = (id: string, active = new Set<string>()): boolean => {
    if (active.size > 128 || active.has(id)) return fail('EXPRESSION_CYCLE', id);
    if (id === context.entryId || nodes.get(id)?.data.kindId === 'variable_get') return true;
    active.add(id);
    try { return doc.edges.filter(edge => edge.target === id && edge.data?.pinType !== 'execution').some(edge => dynamic(edge.source, active)); }
    finally { active.delete(id); }
  };
  const expression = (statementId: string, handle: string, type: string, inferred = false): string => {
    const values = doc.edges.filter(edge => edge.target === statementId && edge.targetHandle === handle);
    if (values.length !== 1) return fail('VALUE_WIRING', statementId);
    const edge = values[0], source = nodes.get(edge.source);
    const pin = source?.data.outputs.find(port => port.id === edge.sourceHandle);
    if (!pin || edge.data?.pinType !== pin.type || pin.type !== nativeScalarSignaturePin(type, language)) return fail('VALUE_PORT', statementId);
    if (edge.source === context.entryId) {
      const parameter = context.parameters.find(parameter => parameter.id === edge.sourceHandle);
      if (!parameter || parameter.nativeType !== type || visible.has(parameter.name)) return fail('PARAMETER_VALUE', statementId);
      return parameter.nativeType;
    }
    if (edge.sourceHandle !== (source!.data.kindId === 'variable_get' ? 'val' : 'result')) return fail('VALUE_HANDLE', statementId);
    const runtime = dynamic(edge.source);
    const analysis = runtime
      ? analyzeNativeRuntimeGraph(doc, edge.source, language, { ...context, returnType: type, inferInitializer: inferred, locals: [...visible.values()] })
      : analyzeNativeConstantGraph(doc, edge.source, language, inferred ? undefined : type);
    if (inferred && language === 'rust' && 'tree' in analysis && !fixedNativeRustInitializer(analysis.tree)) return fail('INFERENCE_CONSTRAINTS_REQUIRED', statementId);
    for (const id of analysis.nodeIds) used.add(id);
    const actualType = 'fact' in analysis ? analysis.fact.nativeType : analysis.nativeType;
    if (actualType !== type) return fail('ASSIGNED_TYPE_CONTEXT', statementId);
    const statement = nodes.get(statementId)!;
    if (language === 'gdscript' && statement.data.kindId === 'var_define' && statement.data.properties?.nativeMutable === false && runtime) return fail('CONSTANT_BINDING_CONTEXT', statementId);
    return actualType;
  };
  let previous = context.entryId, returned = false, valueType: string | undefined;
  const registerDeclaration = (node: GraphDocument['nodes'][number], groupId?: string) => {
    const binding = nativeScalarLocalBinding(node, language, context.symbolId);
    if (node.data.properties?.groupOwnerId !== groupId || declaredIds.has(binding.id) || language !== 'rust' && (visible.has(binding.name) || parameterNames.has(binding.name))) return fail('DECLARATION_IDENTITY', node.id);
    const values = doc.edges.filter(edge => edge.target === node.id && edge.data?.pinType !== 'execution');
    if (values.length !== 1 || values[0].targetHandle !== 'value') return fail('DECLARATION_VALUE', node.id);
    if (binding.inferenceMode === 'gdscript-inferred' && !binding.mutable) return fail('INFERRED_CONSTANT_CONTEXT', node.id);
    expression(node.id, 'value', binding.nativeType, !!binding.inferenceMode);
    visible.set(binding.name, binding); declaredIds.add(binding.id); allLocals.push(binding);
  };
  for (let count = 0; count <= doc.nodes.length; count++) {
    const next = execution.filter(edge => edge.source === previous && edge.sourceHandle === 'exec_out');
    if (next.length !== 1 || next[0].sourceHandle !== 'exec_out' || next[0].targetHandle !== 'exec_in') return fail('FLOW', previous);
    const node = nodes.get(next[0].target);
    if (!node || used.has(node.id) || execution.filter(edge => edge.target === node.id).length !== 1) return fail('FLOW_TARGET', next[0].target);
    const data = node.data, p = data.properties ?? {};
    if (Object.keys(data.inlineValues ?? {}).length) return fail('INLINE_VALUE', node.id);
    const valueEdges = doc.edges.filter(edge => edge.target === node.id && edge.data?.pinType !== 'execution');
    if (data.kindId === 'native_declaration_group') {
      const group = nativeScalarDeclarationGroup(doc, node.id, language, context.symbolId);
      used.add(node.id); statements.push(node.id);
      for (const child of group.declarations) {
        if (used.has(child.id)) return fail('GROUP_FLOW', child.id);
        registerDeclaration(child, node.id); used.add(child.id); statements.push(child.id);
      }
    } else if (data.kindId === 'var_define') {
      registerDeclaration(node);
    } else if (data.kindId === 'variable_set') {
      const binding = [...visible.values()].find(binding => binding.id === data.graphBinding?.symbolId);
      if (!binding || !binding.mutable || data.graphBinding?.kind !== 'variable_ref' || p.symbolId !== binding.id || p.variableName !== binding.name || p.assignmentOperator !== '=') return fail('ASSIGNMENT_OWNER', node.id);
      if (JSON.stringify(data.inputs.map(port => [port.id, port.type])) !== JSON.stringify([['exec_in', 'execution'], ['val', nativeScalarSignaturePin(binding.nativeType, language)]])
        || JSON.stringify(data.outputs.map(port => [port.id, port.type])) !== JSON.stringify([['exec_out', 'execution']]) || valueEdges.length !== 1 || valueEdges[0].targetHandle !== 'val') return fail('ASSIGNMENT_PORTS', node.id);
      expression(node.id, 'val', binding.nativeType);
    } else if (data.kindId === 'flow_return') {
      const unit = signature.nativeReturnType === (language === 'rust' ? '()' : 'void');
      const expected = [['exec_in', 'execution'], ...(!unit ? [['val', nativeScalarSignaturePin(signature.nativeReturnType, language)]] : [])];
      if (JSON.stringify(data.inputs.map(port => [port.id, port.type])) !== JSON.stringify(expected) || data.outputs.length || data.graphBinding
        || valueEdges.length !== (unit ? 0 : 1) || execution.some(edge => edge.source === node.id)) return fail('RETURN_PORTS', node.id);
      if (!unit) valueType = expression(node.id, 'val', signature.nativeReturnType);
      returned = true;
    } else return fail('STATEMENT_KIND', node.id);
    if (!used.has(node.id)) { used.add(node.id); statements.push(node.id); }
    previous = node.id;
    if (returned) break;
  }
  if (!returned || !allLocals.length || execution.length !== statements.length || doc.nodes.some(node => !used.has(node.id))) return fail('BODY_OWNERSHIP', previous);
  for (const edge of doc.edges) {
    if (!used.has(edge.source) || !used.has(edge.target) || edge.target === context.entryId || edge.source === previous) return fail('EDGE_OWNERSHIP', edge.target);
    const source = nodes.get(edge.source)!, target = nodes.get(edge.target)!;
    if (!source.data.outputs.some(pin => pin.id === edge.sourceHandle && pin.type === edge.data?.pinType)
      || !target.data.inputs.some(pin => pin.id === edge.targetHandle)) return fail('EDGE_PORT', edge.target);
  }
  return Object.freeze({ statementIds: Object.freeze(statements), locals: Object.freeze(allLocals), ...(valueType ? { valueType } : {}) });
}
