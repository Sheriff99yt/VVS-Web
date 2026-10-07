import type { GraphDocument, FunctionSymbol, VariableSymbol } from './symbols';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { inspectNativeScalarFunctionFlow } from './nativeScalarFunctionGraphs';
import { nativeScalarLocalBinding, type NativeScalarLocalBinding } from './nativeScalarLocalBindings';
import { transactNativeScalarLocal } from './nativeScalarLocalTransactions';
import { deriveNativeRuntimeGraphForEdit, type NativeRuntimeGraphContext } from './nativeRuntimeGraphs';
import { deriveNativeConstantGraphForEdit } from './nativeConstantGraphs';
import { fixedNativeRustInitializer } from './nativeInferredExpressions';
import { nativeScalarSignaturePin } from './nativeScalarSignatures';
import { syncTypeFieldsFromRef } from './typeRef';

/** Reconcile only the requested function's actual flow. Invalid native operands
 * or group deductions retain the entire authored edit and old mirrors, with a
 * diagnostic; there is no partial repair, guessed type or dropped edge. */
export function reconcileNativeScalarInferences<TDocument extends GraphDocument>(input: {
  variables: VariableSymbol[]; functions: FunctionSymbol[]; documents: Record<string, TDocument>;
}, definitionId: string) {
  const unchanged = (diagnostics: string[] = []) => ({ variables: input.variables, documents: input.documents, diagnostics });
  try {
    const definitions = Object.entries(input.documents).flatMap(([tabId, doc]) => doc.nodes.filter(node => node.id === definitionId && node.data.kindId === 'function_implement').map(node => ({ tabId, node })));
    if (definitions.length !== 1) throw new Error('NATIVE_INFERENCE_RECONCILIATION_OWNER');
    const definition = definitions[0].node, ownerId = definition.data.graphBinding?.symbolId;
    const fn = input.functions.find(fn => fn.id === ownerId);
    const bodyId = fn?.overloads[0]?.graphTabId ?? fn?.id;
    const original = bodyId && input.documents[bodyId];
    const language = definition.data.properties?.nativeSignatureLanguage as NativeScalarLanguage;
    if (!original || !['cpp', 'rust', 'gdscript'].includes(language)) throw new Error('NATIVE_INFERENCE_RECONCILIATION_OWNER');
    if (!original.nodes.some(node => node.data.properties?.nativeInferenceMode)) return unchanged();
    const flow = inspectNativeScalarFunctionFlow(definition.data, original, language);
    // The inspector transaction's ownership check also rejects foreign indexes
    // and cross-document references. Its cloned result is deliberately unused.
    for (const binding of flow.locals ?? []) if (binding.inferenceMode) transactNativeScalarLocal(input, binding.declarationId, {});
    const documents = structuredClone(input.documents), doc = documents[bodyId!];
    let variables = input.variables;
    const visible = new Map<string, NativeScalarLocalBinding>();
    const groupTypes = new Map<string, string>();
    const updateEdges = () => {
      for (const edge of doc.edges) {
        const source = doc.nodes.find(node => node.id === edge.source)?.data.outputs.find(port => port.id === edge.sourceHandle);
        if (source && edge.data?.pinType !== source.type) edge.data = { ...edge.data, pinType: source.type };
      }
    };
    const derive = (statementId: string, handle: string, expectedType: string, inferred: boolean): string => {
      const edges = doc.edges.filter(edge => edge.target === statementId && edge.targetHandle === handle && edge.data?.pinType !== 'execution');
      if (edges.length !== 1) throw new Error('NATIVE_INFERENCE_RECONCILIATION_VALUE');
      const edge = edges[0];
      const context: NativeRuntimeGraphContext = { entryId: flow.entryId, symbolId: ownerId!, parameters: flow.signature.parameters as NativeRuntimeGraphContext['parameters'],
        returnType: expectedType, inferInitializer: inferred, locals: [...visible.values()] };
      if (edge.source === flow.entryId) {
        const parameter = context.parameters.find(parameter => parameter.id === edge.sourceHandle);
        if (!parameter || visible.has(parameter.name)) throw new Error('NATIVE_INFERENCE_RECONCILIATION_PARAMETER');
        return parameter.nativeType;
      }
      const nodes = new Map(doc.nodes.map(node => [node.id, node]));
      let visits = 0;
      const dynamic = (id: string, active = new Set<string>()): boolean => {
        if (++visits > 4096 || active.size > 128 || active.has(id)) throw new Error('NATIVE_INFERENCE_RECONCILIATION_CYCLE');
        if (id === flow.entryId || nodes.get(id)?.data.kindId === 'variable_get') return true;
        active.add(id);
        try { return doc.edges.filter(edge => edge.target === id && edge.data?.pinType !== 'execution').some(edge => dynamic(edge.source, active)); }
        finally { active.delete(id); }
      };
      const analysis = dynamic(edge.source) ? deriveNativeRuntimeGraphForEdit(doc, edge.source, language, context)
        : deriveNativeConstantGraphForEdit(doc, edge.source, language, inferred ? undefined : expectedType);
      if (inferred && language === 'rust' && 'tree' in analysis && !fixedNativeRustInitializer(analysis.tree)) throw new Error('NATIVE_INFERENCE_RECONCILIATION_CONSTRAINTS_REQUIRED');
      for (const [id, domain] of Object.entries(analysis.derivedDomains ?? {})) {
        const node = nodes.get(id)!;
        node.data = { ...node.data, properties: { ...node.data.properties, nativeDomain: domain }, outputs: node.data.outputs.map(port => port.id === 'result' ? { ...port, type: domain === 'native-bool' ? 'data_boolean' : 'data_number' } : port) };
      }
      updateEdges();
      return 'fact' in analysis ? analysis.fact.nativeType : analysis.nativeType;
    };
    for (const id of flow.statementIds ?? []) {
      const node = doc.nodes.find(node => node.id === id)!;
      if (node.data.kindId === 'var_define') {
        let binding = nativeScalarLocalBinding(node, language, ownerId!);
        const type = derive(id, 'value', binding.nativeType, !!binding.inferenceMode);
        if (binding.inferenceMode) {
          const groupId = node.data.properties?.groupOwnerId;
          if (typeof groupId === 'string') {
            const previous = groupTypes.get(groupId);
            if (previous && previous !== type) throw new Error('NATIVE_INFERENCE_RECONCILIATION_GROUP_DEDUCTION');
            groupTypes.set(groupId, type);
          }
          const pin = nativeScalarSignaturePin(type, language);
          if (!pin) throw new Error('NATIVE_INFERENCE_RECONCILIATION_TYPE');
          node.data = { ...node.data, properties: { ...node.data.properties, nativeType: type, type: pin }, inputs: node.data.inputs.map(port => port.id === 'value' ? { ...port, type: pin } : port) };
          for (const reference of doc.nodes) if (['variable_get', 'variable_set'].includes(String(reference.data.kindId)) && reference.data.graphBinding?.symbolId === binding.id) {
            reference.data = { ...reference.data, inputs: reference.data.inputs.map(port => port.id === 'val' ? { ...port, type: pin } : port), outputs: reference.data.outputs.map(port => port.id === 'val' ? { ...port, type: pin } : port) };
          }
          variables = variables.map(variable => variable.id === binding.id ? { ...variable, ...syncTypeFieldsFromRef({ kind: 'builtin', id: pin }) } : variable);
          updateEdges();
          binding = nativeScalarLocalBinding(node, language, ownerId!);
        }
        visible.set(binding.name, binding);
      } else if (node.data.kindId === 'variable_set') {
        const binding = [...visible.values()].find(binding => binding.id === node.data.graphBinding?.symbolId)!;
        derive(id, 'val', binding.nativeType, false);
      } else if (node.data.kindId === 'flow_return' && node.data.inputs.some(port => port.id === 'val')) derive(id, 'val', flow.signature.nativeReturnType, false);
    }
    for (const [id, type] of groupTypes) {
      const group = doc.nodes.find(node => node.id === id)!;
      group.data.properties = { ...group.data.properties, nativeType: type };
    }
    inspectNativeScalarFunctionFlow(definition.data, doc, language);
    return { variables, documents, diagnostics: [] as string[] };
  } catch (error) { return unchanged([error instanceof Error ? error.message : String(error)]); }
}


/** Authored inspector edit plus its dependent inference transaction. Failed
 * deduction preserves the authored edit, making diagnosis/recovery possible. */
export function transactNativeScalarExpressionProperty<TDocument extends GraphDocument>(input: {
  variables: VariableSymbol[]; functions: FunctionSymbol[]; documents: Record<string, TDocument>;
}, nodeId: string, key: string, value: unknown) {
  const matches = Object.entries(input.documents).flatMap(([tabId, doc]) => doc.nodes.filter(node => node.id === nodeId).map(node => ({ tabId, node })));
  if (matches.length !== 1 || typeof value !== 'string') throw new Error('NATIVE_EXPRESSION_EDIT_OWNER');
  const { tabId, node } = matches[0];
  const p = node.data.properties ?? {};
  if (!['cpp', 'rust', 'gdscript'].includes(String(p.nativeLanguage))
    || !(node.data.kindId === 'expr_native_literal' && key === 'payload'
      || node.data.kindId === 'expr_native_operator' && (key === 'operator' || key === 'nativeTargetType'))) throw new Error('NATIVE_EXPRESSION_EDIT_PROPERTY');
  const entry = input.documents[tabId].nodes.find(node => node.data.kindId === 'function_entry');
  const definition = Object.values(input.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === entry?.data.graphBinding?.symbolId);
  if (!definition || definition.data.properties?.nativeSignatureLanguage !== p.nativeLanguage) throw new Error('NATIVE_EXPRESSION_EDIT_OWNER');
  const documents = structuredClone(input.documents);
  const edited = documents[tabId].nodes.find(node => node.id === nodeId)!;
  edited.data.properties = { ...edited.data.properties, [key]: value };
  return reconcileNativeScalarInferences({ ...input, documents }, definition.id);
}
