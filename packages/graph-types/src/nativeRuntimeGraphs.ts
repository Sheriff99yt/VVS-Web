import type { GraphDocument } from './symbols';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import type { NativeScalarParameter } from './nativeScalarSignatures';
import { nativeScalarSignaturePin, canonicalNativeScalarSignatureType } from './nativeScalarSignatures';
import { analyzeNativeConstantGraph } from './nativeConstantGraphs';
import { nativeRuntimeOperatorType, type NativeRuntimeTypeFact } from './nativeRuntimeTypes';
import { nativeScalarLocalBinding, type NativeScalarLocalBinding } from './nativeScalarLocalBindings';
import { fixedNativeRustInitializer, type NativeInferredExpression } from './nativeInferredExpressions';

export interface NativeRuntimeGraphContext {
  readonly entryId: string;
  readonly symbolId: string;
  readonly parameters: readonly (NativeScalarParameter & { readonly id: string })[];
  readonly returnType: string;
  /** Derive an inferred initializer without a declaration/return type hint. */
  readonly inferInitializer?: boolean;
  /** Only bindings initialized and visible at this expression's statement position. */
  readonly locals?: readonly NativeScalarLocalBinding[];
}
export class NativeRuntimeGraphFailure extends Error {
  constructor(public readonly code: string, public readonly nodeId: string) { super(`NATIVE_RUNTIME_GRAPH_${code}: ${nodeId}`); }
}
export interface NativeRuntimeGraphAnalysis extends NativeRuntimeTypeFact {
  readonly nodeIds: readonly string[];
  readonly parameterIds: readonly string[];
  readonly localIds: readonly string[];
  readonly graphAdmission: 'blocked';
}

/** Reconstruct unknown parameter expressions from actual ports/edges; no cached values. */
export function analyzeNativeRuntimeGraph(doc: GraphDocument, rootId: string, language: NativeScalarLanguage, context: NativeRuntimeGraphContext): Readonly<NativeRuntimeGraphAnalysis> {
  const fail = (code: string, id: string): never => { throw new NativeRuntimeGraphFailure(code, id); };
  if (!['cpp', 'rust', 'gdscript'].includes(language)) fail('PROFILE', rootId);
  if (doc.nodes.length > 4096 || doc.edges.length > 8192) fail('BUDGET', rootId);
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  if (nodes.size !== doc.nodes.length || new Set(doc.edges.map(edge => edge.id)).size !== doc.edges.length) fail('DUPLICATE_ID', rootId);
  const entry = nodes.get(context.entryId);
  const parameters = new Map(context.parameters.map(parameter => [parameter.id, parameter]));
  const locals = new Map((context.locals ?? []).map(local => [local.id, local]));
  if (locals.size !== (context.locals ?? []).length) fail('LOCAL_DUPLICATE', rootId);
  for (const local of locals.values()) {
    const declaration = nodes.get(local.declarationId);
    if (!declaration) fail('LOCAL_CONTEXT', local.declarationId);
    const actual = nativeScalarLocalBinding(declaration!, language, context.symbolId);
    if ((['id', 'declarationId', 'name', 'nativeType', 'authoredType', 'mutable', 'inferenceMode'] as const).some(key => actual[key] !== local[key])) fail('LOCAL_CONTEXT', local.declarationId);
  }
  if (parameters.size !== context.parameters.length || !context.symbolId || !entry || entry.data.kindId !== 'function_entry'
    || entry.data.graphBinding?.symbolId !== context.symbolId || entry.data.graphBinding?.kind !== 'call_function'
    || entry.data.properties?.nativeSignatureLanguage !== language || entry.data.inputs.length || Object.keys(entry.data.inlineValues ?? {}).length
    || context.parameters.some(parameter => canonicalNativeScalarSignatureType(parameter.authoredType, language) !== parameter.nativeType)
    || !nativeScalarSignaturePin(context.returnType, language)) fail('CONTEXT', context.entryId);
  const expected = [['exec_out', 'execution'], ...context.parameters.map(parameter => [parameter.id, nativeScalarSignaturePin(parameter.nativeType, language)])];
  if (JSON.stringify(entry!.data.outputs.map(pin => [pin.id, pin.type])) !== JSON.stringify(expected)) fail('ENTRY_PARAMETERS', context.entryId);
  const incoming = new Map<string, typeof doc.edges>();
  for (const edge of doc.edges) { const list = incoming.get(edge.target) ?? []; list.push(edge); incoming.set(edge.target, list); }
  const active = new Set<string>(), used = new Set<string>(), parameterIds = new Set<string>(), localIds = new Set<string>(), dynamic = new Map<string, boolean>();
  let visits = 0;
  const walk = (id: string, depth: number): boolean => {
    if (depth > 128 || ++visits > 4096 || active.has(id)) return fail('BUDGET_OR_CYCLE', id);
    if (dynamic.has(id)) return dynamic.get(id)!;
    const node = nodes.get(id);
    if (!node) return fail('NODE_MISSING', id);
    const data = node.data, properties = data.properties ?? {}, form = properties.nativeForm;
    if (data.kindId === 'variable_get') {
      const local = locals.get(data.graphBinding?.symbolId ?? '');
      if (!local || data.graphBinding?.kind !== 'variable_ref' || properties.symbolId !== local.id || properties.variableName !== local.name
        || properties.nativeType !== undefined || properties.nativeLiteralType !== undefined || properties.defaultValue !== undefined
        || data.inputs.length || Object.keys(data.inlineValues ?? {}).length || (incoming.get(id) ?? []).length
        || JSON.stringify(data.outputs.map(pin => [pin.id, pin.type])) !== JSON.stringify([['val', nativeScalarSignaturePin(local.nativeType, language)]])) return fail('LOCAL_READ', id);
      used.add(id); localIds.add(local.id); dynamic.set(id, true); return true;
    }
    const arity = form === 'scalar' ? 0 : form === 'binary' ? 2 : ['unary', 'parentheses', 'conversion'].includes(String(form)) ? 1 : -1;
    if (properties.nativeLanguage !== language || arity < 0 || properties.operandCount !== arity
      || data.kindId !== (form === 'scalar' ? 'expr_native_literal' : 'expr_native_operator')) return fail('FORM', id);
    if (!['native-integer', 'native-bool'].includes(String(properties.nativeDomain))) return fail('DOMAIN', id);
    if (data.outputs.length !== 1 || data.outputs[0].id !== 'result' || data.outputs[0].type !== (properties.nativeDomain === 'native-bool' ? 'data_boolean' : 'data_number')) return fail('OUTPUT', id);
    if (data.inputs.length !== arity || data.inputs.some((pin, index) => pin.id !== `operand-${index}` || pin.type !== 'data_any')) return fail('INPUT', id);
    if (data.graphBinding || Object.keys(data.inlineValues ?? {}).length) return fail('HIDDEN_OPERAND', id);
    const edges = incoming.get(id) ?? [];
    if (edges.length !== arity || edges.some(edge => !data.inputs.some(pin => pin.id === edge.targetHandle))) return fail('WIRING', id);
    active.add(id); used.add(id);
    try {
      let hasParameter = false;
      for (let index = 0; index < arity; index++) {
        const matches = edges.filter(edge => edge.targetHandle === `operand-${index}`);
        if (matches.length !== 1) return fail('OPERAND', id);
        const edge = matches[0], handle = edge.sourceHandle;
        const sourceType = nodes.get(edge.source)?.data.outputs.find(pin => pin.id === handle)?.type;
        if (!sourceType || edge.data?.pinType !== sourceType || sourceType === 'execution') return fail('OPERAND_TYPE', id);
        if (edge.source === context.entryId) {
          if (!handle || !parameters.has(handle)) return fail('PARAMETER', id);
          if ([...locals.values()].some(local => local.name === parameters.get(handle)!.name)) return fail('SHADOWED_PARAMETER', id);
          hasParameter = true; parameterIds.add(handle); used.add(context.entryId);
        } else {
          if (handle !== (nodes.get(edge.source)?.data.kindId === 'variable_get' ? 'val' : 'result')) return fail('OPERAND_HANDLE', id);
          hasParameter = walk(edge.source, depth + 1) || hasParameter;
        }
      }
      dynamic.set(id, hasParameter); return hasParameter;
    } finally { active.delete(id); }
  };
  if (!walk(rootId, 0)) fail('RUNTIME_PARAMETER_REQUIRED', rootId);
  const operand = (id: string, index: number) => incoming.get(id)!.find(edge => edge.targetHandle === `operand-${index}`)!;
  const hint = (id: string, handle = 'result', depth = 0): string | undefined => {
    if (depth > 128) return fail('BUDGET', id);
    if (id === context.entryId) return parameters.get(handle)?.nativeType;
    if (nodes.get(id)?.data.kindId === 'variable_get') return locals.get(nodes.get(id)!.data.graphBinding!.symbolId)!.nativeType;
    const p = nodes.get(id)!.data.properties!;
    if (p.nativeForm === 'scalar') return ['true', 'false'].includes(String(p.payload)) ? 'bool' : String(p.payload).match(/([iu](?:8|16|32|64|128|size))$/)?.[1];
    if (p.nativeForm === 'conversion') return canonicalNativeScalarSignatureType(String(p.nativeTargetType), language);
    if (p.nativeForm === 'binary' && ['==', '!=', '<', '<=', '>', '>=', '&&', '||', 'and', 'or'].includes(String(p.operator))) return 'bool';
    const left = operand(id, 0);
    const first = hint(left.source, left.sourceHandle!, depth + 1);
    if (p.nativeForm !== 'binary' || ['<<', '>>'].includes(String(p.operator))) return first;
    const right = operand(id, 1); return first ?? hint(right.source, right.sourceHandle!, depth + 1);
  };
  let shortCircuit = false;
  const infer = (id: string, handle = 'result', expectedType?: string, depth = 0): string => {
    if (depth > 128 || ++visits > 8192) return fail('BUDGET', id);
    if (id === context.entryId) return parameters.get(handle)!.nativeType;
    if (nodes.get(id)?.data.kindId === 'variable_get') return locals.get(nodes.get(id)!.data.graphBinding!.symbolId)!.nativeType;
    if (!dynamic.get(id)) return analyzeNativeConstantGraph(doc, id, language, language === 'rust' ? expectedType : undefined).fact.nativeType;
    const p = nodes.get(id)!.data.properties!;
    if (p.nativeLiteralType !== undefined) return fail('HIDDEN_LITERAL_CONTEXT', id);
    const edge = operand(id, 0);
    const read = (index: number, type?: string) => { const value = operand(id, index); return infer(value.source, value.sourceHandle!, type, depth + 1); };
    let type: string;
    if (p.nativeForm === 'parentheses') type = infer(edge.source, edge.sourceHandle!, expectedType, depth + 1);
    else {
      const form = p.nativeForm as 'unary' | 'binary' | 'conversion';
      const operator = form === 'conversion' ? String(p.nativeTargetType) : String(p.operator);
      const comparison = ['==', '!=', '<', '<=', '>', '>='].includes(operator), shift = ['<<', '>>'].includes(operator);
      const right = form === 'binary' ? operand(id, 1) : undefined;
      const contextual = language === 'rust' && form !== 'conversion'
        ? (comparison ? undefined : expectedType) ?? hint(edge.source, edge.sourceHandle!) ?? (right && hint(right.source, right.sourceHandle!)) : undefined;
      const types = form === 'binary' ? [read(0, contextual), read(1, shift ? hint(right!.source, right!.sourceHandle!) : contextual)] : [read(0, contextual)];
      const fact = nativeRuntimeOperatorType(language, form, operator, types);
      shortCircuit ||= fact.evaluation === 'short-circuit'; type = fact.nativeType;
    }
    if (p.nativeDomain !== (type === 'bool' ? 'native-bool' : 'native-integer')) return fail('RESULT_DOMAIN', id);
    return type;
  };
  if (context.inferInitializer && language === 'rust') {
    const tree = (id: string, handle = 'result', depth = 0): NativeInferredExpression => {
      if (depth > 128 || ++visits > 16384) return fail('BUDGET', id);
      if (id === context.entryId) return { kind: 'parameter', nativeType: parameters.get(handle)!.nativeType };
      if (nodes.get(id)?.data.kindId === 'variable_get') return { kind: 'local', nativeType: locals.get(nodes.get(id)!.data.graphBinding!.symbolId)!.nativeType };
      if (!dynamic.get(id)) return analyzeNativeConstantGraph(doc, id, language).tree;
      const p = nodes.get(id)!.data.properties!;
      const read = (index: number) => { const edge = operand(id, index); return tree(edge.source, edge.sourceHandle!, depth + 1); };
      return p.nativeForm === 'parentheses' ? { kind: 'group', operand: read(0) } : p.nativeForm === 'conversion' ? { kind: 'convert', nativeType: String(p.nativeTargetType), operand: read(0) } : p.nativeForm === 'binary' ? { kind: 'binary', operator: String(p.operator), left: read(0), right: read(1) } : { kind: 'unary', operand: read(0) };
    };
    if (!fixedNativeRustInitializer(tree(rootId, nodes.get(rootId)?.data.kindId === 'variable_get' ? 'val' : 'result'))) fail('INFERENCE_CONSTRAINTS_REQUIRED', rootId);
  }
  const nativeType = infer(rootId, nodes.get(rootId)?.data.kindId === 'variable_get' ? 'val' : 'result', context.inferInitializer ? undefined : context.returnType);
  return Object.freeze({ nativeType, domain: nativeType === 'bool' ? 'native-bool' : 'native-integer', evaluation: shortCircuit ? 'short-circuit' : 'ordinary', values: 'unknown', nodeIds: Object.freeze([...used]), parameterIds: Object.freeze([...parameterIds]), localIds: Object.freeze([...localIds]), graphAdmission: 'blocked' });
}
