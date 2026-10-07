import type { GraphDocument, FunctionSymbol, VariableSymbol } from './symbols';
import type { VVSNodeData } from './nodes';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { nativeScalarLocalBinding } from './nativeScalarLocalBindings';
import { canonicalNativeScalarSignatureType, nativeScalarSignaturePin, NATIVE_SCALAR_SIGNATURE_TYPES } from './nativeScalarSignatures';
import { validNativeScalarBindingName } from './nativeScalarNames';
import { syncTypeFieldsFromRef } from './typeRef';

export interface NativeScalarLocalEdit {
  name?: string;
  authoredType?: string;
  mutable?: boolean;
}

/** A native local inspector is owned by the actual declaration, not its variable index. */
export function nativeScalarLocalEditorProfile(data: VVSNodeData) {
  const language = data.properties?.nativeLocalLanguage;
  if (data.kindId !== 'var_define' || typeof language !== 'string'
    || !Object.hasOwn(NATIVE_SCALAR_SIGNATURE_TYPES, language)
    || data.properties?.nativeLocalStyle !== `${language}-scalar`) return;
  return { language: language as NativeScalarLanguage, types: NATIVE_SCALAR_SIGNATURE_TYPES[language as NativeScalarLanguage] };
}

/** Preserve incompatible wiring and unrelated metadata so diagnostics can block and edits can recover. */
export function transactNativeScalarLocal<TDocument extends GraphDocument>(input: {
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  documents: Record<string, TDocument>;
}, declarationId: string, edit: NativeScalarLocalEdit) {
  const fail = (code: string): never => { throw new Error(`NATIVE_SCALAR_LOCAL_TRANSACTION_${code}`); };
  const matches = Object.entries(input.documents).flatMap(([tabId, doc]) => doc.nodes.filter(node => node.id === declarationId).map(node => ({ tabId, node })));
  if (matches.length !== 1) fail('DECLARATION');
  const { tabId, node } = matches[0];
  const profile = nativeScalarLocalEditorProfile(node.data);
  const ownerId = node.data.properties?.nativeOwnerId;
  if (!profile || typeof ownerId !== 'string') fail('OWNER');
  const binding = nativeScalarLocalBinding(node, profile!.language, ownerId as string);
  const owners = input.functions.filter(fn => fn.id === ownerId);
  const fn = owners[0], overload = fn?.overloads[0];
  const definitions = Object.values(input.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === ownerId);
  const entry = input.documents[tabId].nodes.filter(node => node.data.kindId === 'function_entry');
  if (owners.length !== 1 || fn.binding !== 'module' || fn.overloads.length !== 1
    || (overload.graphTabId ?? fn.id) !== tabId || definitions.length !== 1
    || definitions[0].data.properties?.nativeSignatureLanguage !== profile!.language
    || definitions[0].data.graphBinding?.overloadId !== overload.id
    || entry.length !== 1 || entry[0].data.graphBinding?.symbolId !== ownerId
    || entry[0].data.graphBinding?.overloadId !== overload.id) fail('OWNER');
  const declared = Object.values(input.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'var_define' && node.data.properties?.symbolId === binding.id);
  const indexed = input.variables.filter(variable => variable.id === binding.id);
  if (declared.length !== 1 || indexed.length !== 1 || indexed[0].name !== binding.name
    || indexed[0].type !== nativeScalarSignaturePin(binding.nativeType, profile!.language)
    || indexed[0].graphTabId !== tabId || indexed[0].classId !== fn.classId
    || (indexed[0].flags?.readonly ?? false) !== !binding.mutable || indexed[0].defaultValue !== undefined) fail('INDEX_OWNER');
  if (!edit || Object.keys(edit).some(key => !['name', 'authoredType', 'mutable'].includes(key))) fail('EDIT');
  const name = edit.name ?? binding.name, authoredType = edit.authoredType ?? binding.authoredType;
  const mutable = edit.mutable ?? binding.mutable;
  if (!validNativeScalarBindingName(name, profile!.language) || typeof authoredType !== 'string' || typeof mutable !== 'boolean') fail('EDIT');
  if (binding.inferenceMode && edit.authoredType !== undefined) fail('INFERENCE_TYPE_EDIT_REQUIRED');
  const nativeType = binding.inferenceMode ? binding.nativeType : canonicalNativeScalarSignatureType(authoredType, profile!.language);
  if (!nativeType) fail('TYPE');
  const pin = nativeScalarSignaturePin(nativeType!, profile!.language)!;
  for (const [docId, doc] of Object.entries(input.documents)) for (const reference of doc.nodes) {
    if (!['variable_get', 'variable_set'].includes(String(reference.data.kindId)) || reference.data.graphBinding?.symbolId !== binding.id) continue;
    if (docId !== tabId || reference.data.graphBinding.kind !== 'variable_ref'
      || reference.data.properties?.symbolId !== binding.id || reference.data.properties?.variableName !== binding.name) fail('REFERENCE_OWNER');
  }
  const documents = structuredClone(input.documents), doc = documents[tabId];
  const previousOutputs = new Map(doc.nodes.map(node => [node.id, new Map(node.data.outputs.map(port => [port.id, port.type]))]));
  for (const current of doc.nodes) {
    if (current.id === declarationId) {
      current.data = { ...current.data, label: `Declare ${name}`, properties: { ...current.data.properties,
        name, type: pin, nativeAuthoredType: authoredType, nativeType, nativeMutable: mutable,
        isConst: !mutable, declarationKind: mutable ? 'let' : 'const' },
        inputs: current.data.inputs.map(port => port.id === 'value' ? { ...port, type: pin } : port) };
    } else if (['variable_get', 'variable_set'].includes(String(current.data.kindId)) && current.data.graphBinding?.symbolId === binding.id) {
      current.data = { ...current.data, label: `${current.data.kindId === 'variable_get' ? 'Get' : 'Set'} ${name}`,
        properties: { ...current.data.properties, name, variableName: name },
        inputs: current.data.inputs.map(port => port.id === 'val' ? { ...port, type: pin } : port),
        outputs: current.data.outputs.map(port => port.id === 'val' ? { ...port, type: pin } : port) };
    }
  }
  for (const edge of doc.edges) {
    const output = doc.nodes.find(node => node.id === edge.source)?.data.outputs.find(port => port.id === edge.sourceHandle);
    if (output && previousOutputs.get(edge.source)?.get(output.id) !== output.type) edge.data = { ...edge.data, pinType: output.type };
  }
  return { variables: input.variables.map(variable => variable.id === binding.id
    ? { ...variable, ...syncTypeFieldsFromRef({ kind: 'builtin', id: pin }), name, flags: { ...variable.flags, readonly: !mutable } } : variable), documents };
}
