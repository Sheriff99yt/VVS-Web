import type { GraphDocument } from './symbols';
import type { VVSNodeData } from './nodes';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import { nativeScalarFunctionSignatureProblem, nativeScalarSignaturePin, type NativeScalarFunctionSignature, type NativeScalarParameter } from './nativeScalarSignatures';
import { analyzeNativeConstantGraph } from './nativeConstantGraphs';
import { analyzeNativeRuntimeGraph } from './nativeRuntimeGraphs';
import { analyzeNativeLocalFunctionBody } from './nativeLocalFunctionGraphs';
import type { NativeScalarLocalBinding } from './nativeScalarLocalBindings';

export class NativeScalarFunctionGraphFailure extends Error {
  constructor(public readonly code: string) { super(`NATIVE_SCALAR_FUNCTION_GRAPH_${code}`); }
}
export interface NativeScalarGraphParameter extends NativeScalarParameter { readonly id: string }
export interface NativeScalarFunctionGraphAnalysis {
  readonly signature: Readonly<NativeScalarFunctionSignature>;
  readonly entryId: string;
  readonly returnId?: string;
  readonly valueType?: string;
  readonly graphAdmission: 'blocked';
  readonly statementIds?: readonly string[];
  readonly locals?: readonly Readonly<NativeScalarLocalBinding>[];
}

/** Definition-owned headers plus bounded identity/constant/empty body ownership. */
export function analyzeNativeScalarFunctionGraph(definition: VVSNodeData, doc: GraphDocument, language: NativeScalarLanguage): Readonly<NativeScalarFunctionGraphAnalysis> {
  const fail = (code: string): never => { throw new NativeScalarFunctionGraphFailure(code); };
  const properties = definition.properties ?? {};
  const symbolId = definition.graphBinding?.symbolId;
  if (definition.kindId !== 'function_implement' || definition.graphBinding?.kind !== 'call_function' || !symbolId || properties.nativeSignatureLanguage !== language) fail('DEFINITION');
  if (!Array.isArray(properties.nativeParameters)) fail('SIGNATURE');
  const parameters = properties.nativeParameters as NativeScalarGraphParameter[];
  const signature: NativeScalarFunctionSignature = { language, name: properties.functionName as string, parameters,
    authoredReturnType: properties.nativeAuthoredReturnType as string, nativeReturnType: properties.nativeReturnType as string };
  const problem = nativeScalarFunctionSignatureProblem(signature);
  if (problem) fail(problem);
  if (parameters.some(parameter => typeof parameter.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(parameter.id)) || new Set(parameters.map(parameter => parameter.id)).size !== parameters.length) fail('PARAMETER_ID');
  if (definition.inputs.some(pin => pin.type !== 'execution') || Object.keys(definition.inlineValues ?? {}).length) fail('DEFAULT_OR_INLINE');
  if (new Set(doc.nodes.map(node => node.id)).size !== doc.nodes.length || new Set(doc.edges.map(edge => edge.id)).size !== doc.edges.length) fail('DUPLICATE_ID');
  const entries = doc.nodes.filter(node => node.data.kindId === 'function_entry');
  if (entries.length !== 1) fail('ENTRY');
  const entry = entries[0];
  if (entry.data.graphBinding?.symbolId !== symbolId || entry.data.properties?.nativeSignatureLanguage !== language || entry.data.inputs.length || Object.keys(entry.data.inlineValues ?? {}).length) fail('ENTRY_OWNER');
  const expected = [['exec_out', 'execution'], ...parameters.map(parameter => [parameter.id, nativeScalarSignaturePin(parameter.nativeType, language)])];
  if (JSON.stringify(entry.data.outputs.map(pin => [pin.id, pin.type])) !== JSON.stringify(expected)) fail('ENTRY_PARAMETERS');
  const unit = signature.nativeReturnType === (language === 'rust' ? '()' : 'void');
  const returns = doc.nodes.filter(node => node.data.kindId === 'flow_return');
  if (returns.length > 1 || !unit && returns.length !== 1) fail('RETURN_COUNT');
  const ret = returns[0];
  if (ret?.data.properties?.nativeReturnStyle !== undefined && !['explicit', 'rust-tail'].includes(String(ret.data.properties.nativeReturnStyle)) || ret?.data.properties?.nativeReturnStyle === 'rust-tail' && (language !== 'rust' || unit)) fail('RETURN_STYLE');
  if (doc.nodes.some(node => node.data.kindId === 'var_define' && node.data.properties?.nativeLocalLanguage !== undefined)) {
    const body = analyzeNativeLocalFunctionBody(doc, language, { entryId: entry.id, symbolId: symbolId!, parameters, returnType: signature.nativeReturnType }, signature);
    return Object.freeze({ signature: Object.freeze({ ...signature, parameters: Object.freeze(parameters.map(parameter => Object.freeze({ ...parameter }))) }), entryId: entry.id, ...(ret ? { returnId: ret.id } : {}), ...body, graphAdmission: 'blocked' });
  }
  const execution = doc.edges.filter(edge => edge.data?.pinType === 'execution');
  if (!ret) {
    if (doc.nodes.length !== 1 || doc.edges.length) fail('EMPTY_BODY');
  } else {
    const inputs = [['exec_in', 'execution'], ...(!unit ? [['val', nativeScalarSignaturePin(signature.nativeReturnType, language)]] : [])];
    if (JSON.stringify(ret.data.inputs.map(pin => [pin.id, pin.type])) !== JSON.stringify(inputs) || ret.data.outputs.length || Object.keys(ret.data.inlineValues ?? {}).length || ret.data.graphBinding) fail('RETURN_PORTS');
    if (execution.length !== 1 || execution[0].source !== entry.id || execution[0].sourceHandle !== 'exec_out' || execution[0].target !== ret.id || execution[0].targetHandle !== 'exec_in') fail('FLOW');
    if (doc.edges.filter(edge => edge.target === ret.id).length !== (unit ? 1 : 2)) fail('RETURN_EDGES');
  }
  const used = new Set([entry.id, ...(ret ? [ret.id] : [])]);
  let valueType: string | undefined;
  if (ret && !unit) {
    const values = doc.edges.filter(edge => edge.target === ret.id && edge.targetHandle === 'val');
    if (values.length !== 1 || values[0].data?.pinType === 'execution') fail('RETURN_VALUE');
    const value = values[0];
    if (value.source === entry.id) {
      const parameter = parameters.find(parameter => parameter.id === value.sourceHandle);
      if (!parameter) fail('PARAMETER_READ');
      valueType = parameter!.nativeType;
      if (value.data?.pinType !== nativeScalarSignaturePin(valueType, language)) fail('VALUE_EDGE_TYPE');
    } else {
      if (value.sourceHandle !== 'result') fail('VALUE_HANDLE');
      const runtime = doc.edges.some(edge => edge.source === entry.id && edge.target !== ret.id && edge.data?.pinType !== 'execution');
      const constant = runtime
        ? analyzeNativeRuntimeGraph(doc, value.source, language, { entryId: entry.id, symbolId: symbolId!, parameters, returnType: signature.nativeReturnType })
        : analyzeNativeConstantGraph(doc, value.source, language, signature.nativeReturnType);
      if (value.data?.pinType !== doc.nodes.find(node => node.id === value.source)?.data.outputs.find(pin => pin.id === 'result')?.type) fail('VALUE_EDGE_TYPE');
      valueType = 'fact' in constant ? constant.fact.nativeType : constant.nativeType;
      for (const id of constant.nodeIds) used.add(id);
    }
    if (valueType !== signature.nativeReturnType) fail('RETURN_TYPE_CONTEXT_REQUIRED');
  }
  if (doc.nodes.some(node => !used.has(node.id))) fail('ORPHAN');
  for (const edge of doc.edges) {
    if (!used.has(edge.source) || !used.has(edge.target)) fail('EDGE_OWNER');
    if (edge.target === entry.id || edge.source === ret?.id || edge.target === ret?.id && !['exec_in', 'val'].includes(edge.targetHandle ?? '') || unit && edge.target === ret?.id && edge.targetHandle === 'val') fail('EDGE_ROLE');
  }
  return Object.freeze({ signature: Object.freeze({ ...signature, parameters: Object.freeze(parameters.map(parameter => Object.freeze({ ...parameter }))) }), entryId: entry.id, ...(ret ? { returnId: ret.id } : {}), ...(valueType ? { valueType } : {}), graphAdmission: 'blocked' });
}
