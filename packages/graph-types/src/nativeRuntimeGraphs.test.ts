import { expect, test } from 'bun:test';
import { analyzeNativeRuntimeGraph, type NativeRuntimeGraphContext } from './nativeRuntimeGraphs';
import { NATIVE_RUNTIME_TYPE_CASES, type NativeRuntimeTypeCase } from './nativeRuntimeTypeCases';
import { nativeScalarSignaturePin } from './nativeScalarSignatures';
import { buildNativeConstantGraph } from './nativeConstantGraphConstruction';
import type { GraphDocument } from './symbols';

function fixture(item: NativeRuntimeTypeCase) {
  const parameters = item.operands.map((nativeType, i) => ({ id: `parameter-${i}`, name: i ? 'b' : 'a', nativeType, authoredType: nativeType, mutable: false }));
  const context: NativeRuntimeGraphContext = { entryId: 'entry', symbolId: 'sample', parameters, returnType: item.result ?? (item.language === 'rust' ? 'i32' : 'int') };
  const domain = context.returnType === 'bool' ? 'native-bool' : 'native-integer';
  const doc: GraphDocument = { nodes: [
    { id: 'entry', type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { label: 'Entry', category: 'Functions', kindId: 'function_entry', inlineValues: {}, inputs: [], outputs: [{ id: 'exec_out', label: '', type: 'execution' }, ...parameters.map(p => ({ id: p.id, label: p.name, type: nativeScalarSignaturePin(p.nativeType, item.language)! }))], graphBinding: { kind: 'call_function', symbolId: 'sample' }, properties: { nativeSignatureLanguage: item.language } } },
    { id: 'operator', type: 'vvs_standard_node', position: { x: 260, y: 180 }, data: { label: 'Operator', category: 'Native Values', kindId: 'expr_native_operator', inlineValues: {}, inputs: parameters.map((_, i) => ({ id: `operand-${i}`, label: '', type: 'data_any' })), outputs: [{ id: 'result', label: '', type: domain === 'native-bool' ? 'data_boolean' : 'data_number' }], properties: { nativeLanguage: item.language, nativeForm: item.form, nativeDomain: domain, operandCount: parameters.length, ...(item.form === 'conversion' ? { nativeTargetType: item.operator } : { operator: item.operator }) } } },
  ], edges: parameters.map((p, i) => ({ id: `edge-${i}`, source: 'entry', sourceHandle: p.id, target: 'operator', targetHandle: `operand-${i}`, data: { pinType: nativeScalarSignaturePin(p.nativeType, item.language)! } })) };
  return { doc: JSON.parse(JSON.stringify(doc)) as GraphDocument, context };
}
for (const item of NATIVE_RUNTIME_TYPE_CASES) test(`runtime saved wiring ${item.language}/${item.id}`, () => {
  const { doc, context } = fixture(item);
  if (!item.result) expect(() => analyzeNativeRuntimeGraph(doc, 'operator', item.language, context)).toThrow();
  else {
    const result = analyzeNativeRuntimeGraph(doc, 'operator', item.language, context);
    expect(result.nativeType).toBe(item.result);
    expect(result.values).toBe('unknown'); expect(result.graphAdmission).toBe('blocked');
    expect(result.parameterIds).toEqual(context.parameters.map(p => p.id));
    expect(Object.isFrozen(result.nodeIds)).toBe(true);
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  }
});

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`runtime operand ownership mutations ${language}`, () => {
  const item = NATIVE_RUNTIME_TYPE_CASES.find(item => item.language === language && item.id === 'integer-add')!;
  const mutations: ((value: ReturnType<typeof fixture>) => void)[] = [
    v => { v.doc.nodes[0].data.graphBinding!.symbolId = 'foreign'; },
    v => { v.doc.nodes[1].data.inlineValues['operand-0'] = 1; },
    v => { v.doc.nodes[1].data.properties!.nativeDomain = 'native-bool'; },
    v => { v.doc.edges[0].data!.pinType = 'data_boolean'; },
    v => { v.doc.edges[0].sourceHandle = 'exec_out'; v.doc.edges[0].data!.pinType = 'execution'; },
    v => { v.doc.edges[0].sourceHandle = 'missing'; },
    v => { v.doc.edges[0].targetHandle = 'operand-1'; },
    v => { v.doc.edges[0].source = 'operator'; v.doc.edges[0].sourceHandle = 'result'; },
    v => { v.doc.edges.push({ ...v.doc.edges[0], id: 'extra' }); },
    v => { v.doc.nodes.push({ ...v.doc.nodes[1] }); },
    v => { v.doc.nodes[1].data.properties!.nativeLiteralType = 'i8'; },
  ];
  for (const mutate of mutations) {
    const value = fixture(item); mutate(value);
    expect(() => analyzeNativeRuntimeGraph(value.doc, 'operator', language, value.context)).toThrow('NATIVE_RUNTIME_GRAPH_');
  }
});

test('Rust constant islands infer from visible parameter peers and reject poisoned hints', () => {
  const item: NativeRuntimeTypeCase = { language: 'rust', id: 'peer', form: 'binary', operator: '<', operands: ['i8', 'i8'], result: 'bool' };
  const { doc, context } = fixture(item);
  const constant = buildNativeConstantGraph({ kind: 'literal', token: '127' }, 'rust', 'constant');
  doc.nodes.push(...constant.document.nodes); doc.edges.push(...constant.document.edges);
  doc.edges[1].source = constant.rootId; doc.edges[1].sourceHandle = 'result';
  expect(analyzeNativeRuntimeGraph(doc, 'operator', 'rust', context).nativeType).toBe('bool');
  const literal = doc.nodes.find(node => node.id === constant.rootId)!;
  literal.data.properties!.payload = '128';
  expect(() => analyzeNativeRuntimeGraph(doc, 'operator', 'rust', context)).toThrow();
  literal.data.properties!.payload = '127'; literal.data.properties!.nativeLiteralType = 'u8';
  expect(() => analyzeNativeRuntimeGraph(doc, 'operator', 'rust', context)).toThrow('LITERAL_CONTEXT_NOT_ON_GRAPH');
});

test('runtime grouping retains the parameter and nested short-circuit evaluation', () => {
  const { doc, context } = fixture(NATIVE_RUNTIME_TYPE_CASES.find(item => item.language === 'rust' && item.id === 'bool-conjunction')!);
  const group = structuredClone(doc.nodes[1]); group.id = 'group';
  group.data.inputs = [group.data.inputs[0]];
  group.data.properties = { nativeLanguage: 'rust', nativeForm: 'parentheses', nativeDomain: 'native-bool', operandCount: 1 };
  doc.nodes.push(group); doc.edges.push({ id: 'group-input', source: 'operator', sourceHandle: 'result', target: 'group', targetHandle: 'operand-0', data: { pinType: 'data_boolean' } });
  const result = analyzeNativeRuntimeGraph(doc, 'group', 'rust', context);
  expect(result.evaluation).toBe('short-circuit'); expect(result.nativeType).toBe('bool');
});
