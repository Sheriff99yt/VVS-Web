import type { GraphDocument } from './symbols';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { nativeScalarLocalBinding, NativeScalarLocalFailure } from './nativeScalarLocalBindings';
import { canonicalNativeScalarSignatureType } from './nativeScalarSignatures';
import { transactNativeScalarLocal, type NativeScalarLocalEdit } from './nativeScalarLocalTransactions';
import type { FunctionSymbol, VariableSymbol } from './symbols';

export type NativeScalarGroupEdit = Pick<NativeScalarLocalEdit, 'authoredType' | 'mutable'>;

/** Coordinated group spelling/type/readonly edits leave incompatible values for diagnostics. */
export function transactNativeScalarDeclarationGroup<TDocument extends GraphDocument>(input: { variables: VariableSymbol[]; functions: FunctionSymbol[]; documents: Record<string, TDocument> }, groupId: string, edit: NativeScalarGroupEdit) {
  const matches = Object.entries(input.documents).flatMap(([tabId, doc]) => doc.nodes.filter(node => node.id === groupId).map(node => ({ tabId, node })));
  if (matches.length !== 1 || !edit || Object.keys(edit).some(key => !['authoredType', 'mutable'].includes(key))) throw new NativeScalarLocalFailure('GROUP_EDIT', groupId);
  const { tabId, node } = matches[0];
  const original = nativeScalarDeclarationGroup(input.documents[tabId], groupId, 'cpp', String(node.data.properties?.nativeOwnerId));
  let next = { variables: input.variables, documents: input.documents };
  for (const child of original.declarations) next = transactNativeScalarLocal({ ...next, functions: input.functions }, child.id, edit);
  const group = next.documents[tabId].nodes.find(node => node.id === groupId)!;
  const child = next.documents[tabId].nodes.find(node => node.id === original.declarations[0].id)!;
  group.data.properties = { ...group.data.properties, nativeAuthoredType: child.data.properties!.nativeAuthoredType, nativeType: child.data.properties!.nativeType, nativeMutable: child.data.properties!.nativeMutable };
  nativeScalarDeclarationGroup(next.documents[tabId], groupId, 'cpp', String(node.data.properties?.nativeOwnerId));
  return next;
}

/** Group order and membership come from visible flow and child declarations. */
export function nativeScalarDeclarationGroup(doc: GraphDocument, groupId: string, language: NativeScalarLanguage, ownerId: string) {
  const fail = (code: string): never => { throw new NativeScalarLocalFailure(`GROUP_${code}`, groupId); };
  const group = doc.nodes.find(node => node.id === groupId), p = group?.data.properties ?? {};
  if (!group || group.data.kindId !== 'native_declaration_group' || language !== 'cpp' || p.nativeLocalLanguage !== language || p.nativeOwnerId !== ownerId
    || group.data.graphBinding || typeof p.nativeAuthoredType !== 'string' || (p.nativeInferenceMode === undefined ? canonicalNativeScalarSignatureType(p.nativeAuthoredType, language) !== p.nativeType : p.nativeInferenceMode !== 'cpp-auto' || p.nativeAuthoredType !== 'auto' || !canonicalNativeScalarSignatureType(String(p.nativeType), language))
    || typeof p.nativeMutable !== 'boolean' || Object.keys(group.data.inlineValues ?? {}).length
    || JSON.stringify(group.data.inputs.map(pin => [pin.id, pin.type])) !== JSON.stringify([['exec_in', 'execution']])
    || JSON.stringify(group.data.outputs.map(pin => [pin.id, pin.type])) !== JSON.stringify([['declarations_exec', 'execution'], ['exec_out', 'execution']])
    || doc.edges.some(edge => edge.target === groupId && edge.data?.pinType !== 'execution')) return fail('OWNER');
  const declarations: NonNullable<typeof group>[] = [];
  const seen = new Set<string>();
  let previous = groupId, handle = 'declarations_exec';
  for (;;) {
    const edges = doc.edges.filter(edge => edge.source === previous && edge.sourceHandle === handle);
    if (!edges.length) break;
    if (edges.length !== 1 || edges[0].data?.pinType !== 'execution' || edges[0].targetHandle !== 'exec_in' || seen.has(edges[0].target) || seen.size >= 512) return fail('FLOW');
    const declaration = doc.nodes.find(node => node.id === edges[0].target);
    if (!declaration || doc.edges.filter(edge => edge.target === declaration.id && edge.data?.pinType === 'execution').length !== 1) return fail('FLOW');
    const binding = nativeScalarLocalBinding(declaration, language, ownerId);
    if (declaration.data.properties?.groupOwnerId !== groupId || binding.authoredType !== p.nativeAuthoredType
      || binding.nativeType !== p.nativeType || binding.mutable !== p.nativeMutable || binding.inferenceMode !== p.nativeInferenceMode) return fail('DECLARATOR');
    declarations.push(declaration); seen.add(declaration.id); previous = declaration.id; handle = 'exec_out';
  }
  if (declarations.length < 2 || doc.nodes.some(node => node.data.properties?.groupOwnerId === groupId && !seen.has(node.id))) return fail('MEMBERSHIP');
  return Object.freeze({ id: groupId, authoredType: p.nativeAuthoredType as string, nativeType: String(p.nativeType), mutable: p.nativeMutable as boolean, ...(p.nativeInferenceMode ? { inferenceMode: 'cpp-auto' as const } : {}), declarations: Object.freeze(declarations) });
}
