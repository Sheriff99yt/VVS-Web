import type { GraphDocument, FunctionSymbol, VariableSymbol } from './symbols';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { nativeScalarLocalBinding, nativeScalarInferenceSpelling, type NativeScalarInferenceMode, type NativeScalarLocalBinding } from './nativeScalarLocalBindings';
import { nativeScalarDeclarationGroup } from './nativeScalarDeclarationGroups';
import { inspectNativeScalarFunctionFlow, type NativeScalarGraphParameter } from './nativeScalarFunctionGraphs';
import { analyzeNativeRuntimeGraph, type NativeRuntimeGraphContext } from './nativeRuntimeGraphs';
import { analyzeNativeConstantGraph } from './nativeConstantGraphs';
import { fixedNativeRustInitializer } from './nativeInferredExpressions';
import { nativeScalarSignaturePin } from './nativeScalarSignatures';
import { transactNativeScalarLocal } from './nativeScalarLocalTransactions';

export interface NativeScalarDeclarationModeEdit { declarationMode: 'typed' | 'inferred' }

/** Caller supplies the actual flow-visible locals. No declaration/index type
 * becomes an inference hint. Strict expression ownership remains mandatory. */
export function deriveNativeScalarLocalInitializer(doc: GraphDocument, declarationId: string, language: NativeScalarLanguage, context: NativeRuntimeGraphContext): string {
  const fail = (code: string): never => { throw new Error(`NATIVE_DECLARATION_MODE_${code}`); };
  const actualEntry = doc.nodes.find(node => node.id === context.entryId);
  if (!actualEntry || actualEntry.data.kindId !== 'function_entry' || actualEntry.data.graphBinding?.symbolId !== context.symbolId
    || actualEntry.data.graphBinding?.kind !== 'call_function' || actualEntry.data.properties?.nativeSignatureLanguage !== language
    || actualEntry.data.inputs.length || Object.keys(actualEntry.data.inlineValues ?? {}).length
    || JSON.stringify(actualEntry.data.outputs.map(port => [port.id, port.type])) !== JSON.stringify([['exec_out', 'execution'], ...context.parameters.map(parameter => [parameter.id, nativeScalarSignaturePin(parameter.nativeType, language)])])) return fail('ENTRY_OWNER');
  const edges = doc.edges.filter(edge => edge.target === declarationId && edge.data?.pinType !== 'execution');
  if (edges.length !== 1 || edges[0].targetHandle !== 'value') return fail('VALUE');
  const edge = edges[0];
  if (edge.source === context.entryId) {
    const parameter = context.parameters.find(parameter => parameter.id === edge.sourceHandle);
    const entry = doc.nodes.find(node => node.id === context.entryId);
    if (!parameter || (context.locals ?? []).some(local => local.name === parameter.name) || edge.data?.pinType !== nativeScalarSignaturePin(parameter.nativeType, language)
      || !entry?.data.outputs.some(port => port.id === edge.sourceHandle && port.type === edge.data?.pinType)) return fail('PARAMETER');
    return parameter.nativeType;
  }
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  if (edge.sourceHandle !== (nodes.get(edge.source)?.data.kindId === 'variable_get' ? 'val' : 'result')) return fail('VALUE_HANDLE');
  let visits = 0;
  const dynamic = (id: string, active = new Set<string>()): boolean => {
    if (++visits > 4096 || active.size > 128 || active.has(id)) return fail('BUDGET_OR_CYCLE');
    if (id === context.entryId || nodes.get(id)?.data.kindId === 'variable_get') return true;
    active.add(id);
    try { return doc.edges.filter(edge => edge.target === id && edge.data?.pinType !== 'execution').some(edge => dynamic(edge.source, active)); }
    finally { active.delete(id); }
  };
  if (dynamic(edge.source)) return analyzeNativeRuntimeGraph(doc, edge.source, language, { ...context, inferInitializer: true }).nativeType;
  const analysis = analyzeNativeConstantGraph(doc, edge.source, language);
  if (language === 'rust' && !fixedNativeRustInitializer(analysis.tree)) return fail('INFERENCE_CONSTRAINTS_REQUIRED');
  return analysis.fact.nativeType;
}

/** Explicit authored mode change, including an entire C++ group. Inference
 * conversion requires independently reconstructed fixed initializer types.
 * Typed conversion keeps incompatible values/wires so diagnostics can recover. */
export function transactNativeScalarDeclarationMode<TDocument extends GraphDocument>(input: {
  variables: VariableSymbol[]; functions: FunctionSymbol[]; documents: Record<string, TDocument>;
}, selectedId: string, edit: NativeScalarDeclarationModeEdit) {
  const fail = (code: string): never => { throw new Error(`NATIVE_DECLARATION_MODE_${code}`); };
  if (!edit || Object.keys(edit).length !== 1 || !['typed', 'inferred'].includes(edit.declarationMode)) return fail('EDIT');
  const matches = Object.entries(input.documents).flatMap(([tabId, doc]) => doc.nodes.filter(node => node.id === selectedId).map(node => ({ tabId, node })));
  if (matches.length !== 1) return fail('OWNER');
  const { tabId, node } = matches[0];
  const groupId = node.data.kindId === 'native_declaration_group' ? node.id : node.data.properties?.groupOwnerId;
  const owner = typeof groupId === 'string' ? input.documents[tabId].nodes.find(node => node.id === groupId) : node;
  if (!owner) return fail('OWNER');
  const language = owner.data.properties?.nativeLocalLanguage as NativeScalarLanguage;
  const ownerId = owner.data.properties?.nativeOwnerId;
  if (!['cpp', 'rust', 'gdscript'].includes(language) || typeof ownerId !== 'string') return fail('OWNER');
  const group = typeof groupId === 'string' ? nativeScalarDeclarationGroup(input.documents[tabId], groupId, language, ownerId) : undefined;
  const declarations = group ? group.declarations : [node];
  const bindings = declarations.map(node => nativeScalarLocalBinding(node, language, ownerId));
  // Existing transaction checks definition/entry/index/reference ownership and
  // clones private state before any mode metadata is changed.
  let next = { variables: input.variables, documents: input.documents };
  for (const declaration of declarations) next = transactNativeScalarLocal({ ...next, functions: input.functions }, declaration.id, {});
  const mode = `${language === 'cpp' ? 'cpp-auto' : language === 'rust' ? 'rust-let' : 'gdscript-inferred'}` as NativeScalarInferenceMode;
  if (edit.declarationMode === 'inferred' && bindings.some(binding => !binding.inferenceMode)) {
    if (language === 'gdscript' && bindings.some(binding => !binding.mutable)) return fail('INFERRED_CONSTANT_CONTEXT');
    const definition = Object.values(input.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === ownerId)!;
    const analysis = inspectNativeScalarFunctionFlow(definition.data, input.documents[tabId], language);
    const selected = new Set(bindings.map(binding => binding.id));
    const last = Math.max(...bindings.map(binding => analysis.locals?.findIndex(local => local.id === binding.id) ?? -1));
    if (last < 0 || bindings.some(binding => !analysis.locals?.some(local => local.id === binding.id))) return fail('FLOW');
    const visible = new Map<string, NativeScalarLocalBinding>();
    for (const binding of analysis.locals!.slice(0, last + 1)) {
      // A preceding inferred mirror must be independently checked before it
      // can supply the native type of a later initializer's actual local read.
      if (selected.has(binding.id) || binding.inferenceMode) {
        const derived = deriveNativeScalarLocalInitializer(input.documents[tabId], binding.declarationId, language, { entryId: analysis.entryId, symbolId: ownerId,
          parameters: definition.data.properties!.nativeParameters as NativeScalarGraphParameter[], returnType: binding.nativeType, locals: [...visible.values()] });
        if (derived !== binding.nativeType) return fail('INFERENCE_TYPE_CONSTRAINTS_REQUIRED');
      }
      visible.set(binding.name, binding);
    }
  }
  for (const binding of bindings) {
    const current = next.documents[tabId].nodes.find(node => node.id === binding.declarationId)!;
    current.data.properties = { ...current.data.properties, nativeAuthoredType: edit.declarationMode === 'inferred' ? nativeScalarInferenceSpelling(mode, language)! : binding.nativeType };
    if (edit.declarationMode === 'inferred') current.data.properties.nativeInferenceMode = mode;
    else delete current.data.properties.nativeInferenceMode;
  }
  if (group) {
    const current = next.documents[tabId].nodes.find(node => node.id === group.id)!;
    current.data.properties = { ...current.data.properties, nativeAuthoredType: edit.declarationMode === 'inferred' ? 'auto' : group.nativeType };
    if (edit.declarationMode === 'inferred') current.data.properties.nativeInferenceMode = 'cpp-auto';
    else delete current.data.properties.nativeInferenceMode;
    nativeScalarDeclarationGroup(next.documents[tabId], group.id, language, ownerId);
  }
  return next;
}
