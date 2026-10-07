import type { GraphDocument, FunctionSymbol } from './symbols';
import type { VVSNodeData } from './nodes';
import { nativeScalarSignatureEditorProfile } from './nativeScalarSignatureEdits';
import { nativeScalarSignaturePin, nativeScalarFunctionSignatureProblem } from './nativeScalarSignatures';
import { applyFunctionImplementBinding, applyFunctionEntryBinding, applyFunctionCallBinding } from './functionBindings';
import { nativeSignature } from './nativeSignatures';

/** One immutable declaration/symbol/body edit. Retain incompatible wiring for diagnostics. */
export function transactNativeScalarSignature<TDocument extends GraphDocument>(input: { functions: FunctionSymbol[]; documents: Record<string, TDocument> }, definitionId: string, edited: VVSNodeData) {
  const fail = (code: string): never => { throw new Error(`NATIVE_SCALAR_SIGNATURE_TRANSACTION_${code}`); };
  const definitions = Object.entries(input.documents).flatMap(([tabId, doc]) => doc.nodes.filter(node => node.id === definitionId).map(node => ({ tabId, node })));
  if (definitions.length !== 1) fail('DEFINITION');
  const original = definitions[0].node.data;
  const profile = nativeScalarSignatureEditorProfile(edited), parameters = nativeSignature(edited);
  const symbolId = original.graphBinding?.symbolId;
  const fn = input.functions.find(fn => fn.id === symbolId);
  const overload = original.graphBinding?.overloadId
    ? fn?.overloads.find(item => item.id === original.graphBinding!.overloadId)
    : fn?.overloads.length === 1 ? fn.overloads[0] : undefined;
  if (!profile || !parameters || !fn || !overload || original.kindId !== 'function_implement' || edited.kindId !== original.kindId
    || original.properties?.nativeSignatureLanguage !== profile.language || edited.graphBinding?.symbolId !== symbolId
    || original.graphBinding?.kind !== 'call_function' || edited.graphBinding?.kind !== 'call_function'
    || edited.graphBinding?.overloadId !== original.graphBinding?.overloadId || edited.properties?.functionName !== fn.name
    || fn.binding !== 'module' || fn.overloads.length !== 1 || overload.returnParameters?.length) fail('OWNER');
  if (Object.values(input.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === symbolId).length !== 1) fail('OWNER');
  const params = parameters!;
  const problem = nativeScalarFunctionSignatureProblem({ language: profile!.language, name: fn!.name, parameters: params.map(p => ({ name: p.name, authoredType: p.authoredType!, nativeType: p.nativeType!, mutable: p.mutable! })), authoredReturnType: String(edited.properties?.nativeAuthoredReturnType), nativeReturnType: String(edited.properties?.nativeReturnType) });
  if (problem || JSON.stringify(params.map(p => [p.id, p.name])) !== JSON.stringify(overload!.parameters.map(p => [p.id, p.label]))) fail('SIGNATURE');
  const bodyId = overload!.graphTabId ?? fn!.id;
  const body = input.documents[bodyId];
  if (!body || body.nodes.filter(node => node.data.kindId === 'function_entry').length !== 1 || body.nodes.find(node => node.data.kindId === 'function_entry')!.data.graphBinding?.symbolId !== fn!.id) fail('BODY');
  const returnType = String(edited.properties!.nativeReturnType);
  const unit = returnType === profile!.unit;
  const nextFunction: FunctionSymbol = { ...fn!, overloads: [{ ...overload!, parameters: overload!.parameters.map(p => ({ ...p, type: nativeScalarSignaturePin(params.find(parameter => parameter.id === p.id)!.nativeType!, profile!.language)! })), returnType: unit ? 'void' : nativeScalarSignaturePin(returnType, profile!.language)! }] };
  const documents = structuredClone(input.documents);
  for (const [tabId, doc] of Object.entries(documents)) {
    const previousOutputs = new Map(doc.nodes.map(node => [node.id, new Map(node.data.outputs.map(pin => [pin.id, pin.type]))]));
    for (const node of doc.nodes) {
      if (node.id === definitionId && tabId === definitions[0].tabId) node.data = applyFunctionImplementBinding(structuredClone(edited), nextFunction, overload!.id);
      else if (node.data.graphBinding?.symbolId === nextFunction.id && node.data.kindId === 'function_entry') node.data = applyFunctionEntryBinding(node.data, nextFunction, overload!.id);
      else if (node.data.graphBinding?.symbolId === nextFunction.id && ['call_function', 'vvs.project.call_function'].includes(String(node.data.kindId))) node.data = applyFunctionCallBinding(node.data, nextFunction, overload!.id);
      if (tabId === bodyId && node.data.kindId === 'flow_return') node.data = { ...node.data, inputs: [{ id: 'exec_in', label: '', type: 'execution' }, ...(!unit ? [{ id: 'val', label: 'Value', type: nativeScalarSignaturePin(returnType, profile!.language)! }] : [])] };
    }
    for (const edge of doc.edges) {
      const source = doc.nodes.find(node => node.id === edge.source)?.data.outputs.find(pin => pin.id === edge.sourceHandle);
      if (source && previousOutputs.get(edge.source)?.get(source.id) !== source.type) edge.data = { ...edge.data, pinType: source.type };
    }
  }
  return { functions: input.functions.map(fn => fn.id === nextFunction.id ? nextFunction : fn), documents };
}
