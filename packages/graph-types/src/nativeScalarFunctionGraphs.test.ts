import { expect, test } from 'bun:test';
import cases from '../../../tools/native_signature_cases.json';
import { analyzeNativeScalarFunctionGraph } from './nativeScalarFunctionGraphs';
import { nativeScalarSignaturePin } from './nativeScalarSignatures';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import type { VVSNodeData } from './nodes';
import type { GraphDocument } from './symbols';

function fixture(language: NativeScalarLanguage, type: string, parameters: { name: string; type: string; mutable: boolean }[]) {
  const params = parameters.map((parameter, index) => ({ id: `param-${index}`, name: parameter.name, nativeType: parameter.type, authoredType: parameter.type, mutable: parameter.mutable }));
  const definition: VVSNodeData = { label: 'sample', category: 'Functions', kindId: 'function_implement', inputs: [], outputs: [], inlineValues: {}, graphBinding: { kind: 'call_function', symbolId: 'sample' },
    properties: { functionName: 'sample', nativeSignatureLanguage: language, nativeParameters: params, nativeAuthoredReturnType: type, nativeReturnType: type } };
  const doc: GraphDocument = { nodes: [{ id: 'entry', type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { label: 'Entry', category: 'Functions', kindId: 'function_entry', inputs: [], inlineValues: {}, graphBinding: { kind: 'call_function', symbolId: 'sample' }, properties: { nativeSignatureLanguage: language }, outputs: [{ id: 'exec_out', label: '', type: 'execution' }, ...params.map(parameter => ({ id: parameter.id, label: parameter.name, type: nativeScalarSignaturePin(parameter.nativeType, language)! }))] } }], edges: [] };
  if (!['void', '()'].includes(type)) {
    doc.nodes.push({ id: 'return', type: 'vvs_standard_node', position: { x: 300, y: 0 }, data: { label: 'Return', category: 'Flow', kindId: 'flow_return', inputs: [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'val', label: 'Value', type: nativeScalarSignaturePin(type, language)! }], outputs: [], inlineValues: {} } });
    doc.edges.push({ id: 'flow', source: 'entry', sourceHandle: 'exec_out', target: 'return', targetHandle: 'exec_in', data: { pinType: 'execution' } }, { id: 'value', source: 'entry', sourceHandle: params[0].id, target: 'return', targetHandle: 'val', data: { pinType: nativeScalarSignaturePin(type, language)! } });
  }
  return JSON.parse(JSON.stringify({ definition, doc })) as { definition: VVSNodeData; doc: GraphDocument };
}

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const item of cases[language]) {
  if ('unsupported' in item && item.unsupported || item.id === 'mutable-parameter') continue;
  test(`native identity/empty saved function ${language}/${item.id}`, () => {
    const { definition, doc } = fixture(language, item.returnType, item.parameters);
    const analysis = analyzeNativeScalarFunctionGraph(definition, doc, language);
    expect(analysis.signature.nativeReturnType).toBe(item.returnType);
    expect(analysis.graphAdmission).toBe('blocked');
    expect(Object.isFrozen(analysis.signature.parameters)).toBe(true);
    if (item.parameters.length) expect(analysis.valueType).toBe(item.returnType);
  });
}

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`owned scalar function mutations ${language}`, () => {
  const type = language === 'rust' ? 'i32' : 'int';
  const create = () => fixture(language, type, [{ name: 'value', type, mutable: language !== 'rust' }]);
  const mutations: ((value: ReturnType<typeof create>) => void)[] = [
    value => { value.doc.nodes[0].data.graphBinding!.symbolId = 'other'; },
    value => { value.definition.properties!.nativeReturnType = 'bool'; },
    value => { value.doc.edges[1].sourceHandle = 'missing'; },
    value => { value.doc.nodes[1].data.inlineValues.val = 1; },
    value => { value.doc.edges.push({ ...value.doc.edges[0], id: 'extra', data: { pinType: 'data_any' } }); },
    value => { value.doc.nodes.push({ ...value.doc.nodes[1], id: 'orphan' }); },
    value => { value.doc.nodes[0].data.outputs[1].type = 'data_boolean'; },
    value => { value.doc.edges[1].data!.pinType = 'data_boolean'; },
    value => { value.doc.edges[0].sourceHandle = 'param-0'; },
    value => { value.doc.edges.pop(); },
    value => { value.doc.edges[1].targetHandle = 'hidden'; },
  ];
  for (const mutate of mutations) { const value = create(); mutate(value); expect(() => analyzeNativeScalarFunctionGraph(value.definition, value.doc, language)).toThrow('NATIVE_SCALAR_FUNCTION_GRAPH_'); }
  const value = create();
  value.doc.nodes.push({ id: 'literal', type: 'vvs_standard_node', position: { x: 100, y: 100 }, data: { label: '1', category: 'Expression', kindId: 'expr_native_literal', inputs: [], outputs: [{ id: 'result', label: '', type: 'data_any' }], inlineValues: {}, properties: { nativeLanguage: language, nativeForm: 'scalar', operandCount: 0, payload: '1' } } });
  Object.assign(value.doc.edges[1], { source: 'literal', sourceHandle: 'result', data: { pinType: 'data_any' } });
  expect(analyzeNativeScalarFunctionGraph(value.definition, value.doc, language).valueType).toBe(type);
  value.doc.nodes[2].data.properties!.payload = 'true';
  expect(() => analyzeNativeScalarFunctionGraph(value.definition, value.doc, language)).toThrow('RETURN_TYPE_CONTEXT_REQUIRED');
});
