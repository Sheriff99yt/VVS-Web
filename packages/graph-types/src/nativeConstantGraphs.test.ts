import { expect, test } from 'bun:test';
import cases from '../../../tools/native_constant_cases.json';
import { analyzeNativeConstantGraph } from './nativeConstantGraphs';
import type { NativeConstantExpression } from './nativeConstantExpressions';
import type { NativeScalarLanguage } from './nativeScalarContracts';
import type { GraphDocument } from './symbols';

function graph(expression: NativeConstantExpression, language: NativeScalarLanguage) {
  const doc: GraphDocument = { nodes: [], edges: [] };
  const add = (tree: NativeConstantExpression): string => {
    // Literal sign facts must become visible unary nodes on the saved graph.
    if (tree.kind === 'literal' && tree.options?.negated) return add({ kind: 'unary', operator: '-', operand: { ...tree, options: { ...tree.options, negated: false } }, directLiteral: true });
    if (language === 'gdscript' && tree.kind === 'unary' && tree.operator === '-' && tree.operand.kind === 'literal' && tree.directLiteral !== true) return add({ ...tree, operand: { kind: 'group', operand: tree.operand } });
    const id = `node-${doc.nodes.length}`;
    const children = tree.kind === 'binary' ? [tree.left, tree.right] : tree.kind === 'literal' ? [] : [tree.operand];
    const form = tree.kind === 'literal' ? 'scalar' : tree.kind === 'group' ? 'parentheses' : tree.kind === 'convert' ? 'conversion' : tree.kind;
    doc.nodes.push({ id, type: 'vvs_standard_node', position: { x: doc.nodes.length * 100, y: 0 }, data: {
      label: form, category: 'expression', kindId: tree.kind === 'literal' ? 'expr_native_literal' : 'expr_native_operator',
      inputs: children.map((_, index) => ({ id: `operand-${index}`, label: `Operand ${index + 1}`, type: 'data_any' })),
      outputs: [{ id: 'result', label: 'Result', type: 'data_any' }], inlineValues: {},
      properties: { nativeLanguage: language, nativeForm: form, operandCount: children.length,
        ...(tree.kind === 'literal' ? { payload: tree.token, ...(tree.options?.expectedType ? { nativeLiteralType: tree.options.expectedType } : {}) } : {}),
        ...(tree.kind === 'convert' ? { nativeTargetType: tree.nativeType } : {}),
        ...('operator' in tree ? { operator: tree.operator } : {}),
      },
    } });
    children.forEach((child, index) => { const source = add(child); doc.edges.push({ id: `edge-${doc.edges.length}`, source, sourceHandle: 'result', target: id, targetHandle: `operand-${index}`, data: { pinType: 'data_any' } }); });
    return id;
  };
  const rootId = add(expression);
  return { doc: JSON.parse(JSON.stringify(doc)) as GraphDocument, rootId };
}

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  if (fixture.calibration) continue;
  test(`saved constant graph ${language}/${fixture.id}`, () => {
    const { doc, rootId } = graph(fixture.tree as NativeConstantExpression, language);
    const analyze = () => analyzeNativeConstantGraph(doc, rootId, language);
    if (fixture.modelDiagnostic) expect(analyze).toThrow(`${language.toUpperCase()}_${fixture.modelDiagnostic}`);
    else {
      const result = analyze();
      expect(result.fact.nativeType).toBe(fixture.nativeType);
      expect(String(result.fact.payload)).toBe(fixture.payload);
      expect(result.nodeIds.length).toBe(doc.nodes.length);
      expect(result.graphAdmission).toBe('blocked');
      expect(Object.isFrozen(result.tree)).toBe(true);
    }
  });
}

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`saved graph mutations ${language}`, () => {
  const { doc, rootId } = graph({ kind: 'binary', operator: '/', left: { kind: 'literal', token: '12' }, right: { kind: 'literal', token: '3' } }, language);
  const analyze = () => analyzeNativeConstantGraph(doc, rootId, language);
  const properties = doc.nodes[2].data.properties!;
  properties.cachedFact = { payload: '999', nativeType: 'bool' };
  expect(analyze().fact.payload).toBe('4');
  properties.payload = '2'; expect(analyze().fact.payload).toBe('6');
  properties.payload = '0'; expect(analyze).toThrow('CONSTANT_DIVIDE_BY_ZERO');
  properties.payload = '2';
  doc.nodes[0].data.properties!.operator = '*'; expect(analyze().fact.payload).toBe('24');
  doc.nodes[0].data.properties!.operator = '&&'; expect(analyze).toThrow('CONDITIONAL_EVALUATION');
});

test('saved graph rejects corrupted wiring, hidden inputs, wrong targets and cycles', () => {
  const expression: NativeConstantExpression = { kind: 'binary', operator: '+', left: { kind: 'literal', token: '1' }, right: { kind: 'literal', token: '2' } };
  const mutations: ((doc: GraphDocument) => void)[] = [
    doc => { doc.nodes[1].data.properties!.nativeLanguage = 'cpp'; },
    doc => { doc.nodes[0].data.inlineValues['operand-0'] = 7; },
    doc => { doc.edges[0].sourceHandle = 'missing'; },
    doc => { doc.edges[1].targetHandle = 'operand-0'; },
    doc => { doc.edges.push({ ...doc.edges[0], id: 'extra' }); },
    doc => { doc.edges[0].source = 'missing'; },
    doc => { doc.edges[0].source = doc.nodes[0].id; },
    doc => { doc.nodes.push({ ...doc.nodes[0] }); },
    doc => { doc.nodes[0].data.properties!.operandCount = 1; },
    doc => { doc.nodes[1].data.inputs.push({ id: 'hidden', label: 'Hidden', type: 'data_any' }); },
    doc => { doc.nodes[0].data.kindId = 'function_entry'; },
    doc => { doc.nodes[1].data.outputs[0].type = 'data_number'; },
    doc => { doc.nodes[1].data.properties!.payload = 'someCall()'; },
  ];
  for (const mutate of mutations) {
    const { doc, rootId } = graph(expression, 'rust'); mutate(doc);
    expect(() => analyzeNativeConstantGraph(doc, rootId, 'rust')).toThrow();
  }
});

test('Godot negative literal ownership follows actual grouping after a saved edit', () => {
  const direct = graph({ kind: 'unary', operator: '-', operand: { kind: 'literal', token: '0xffffffffffffffff' }, directLiteral: true }, 'gdscript');
  const grouped = graph({ kind: 'unary', operator: '-', operand: { kind: 'group', operand: { kind: 'literal', token: '0xffffffffffffffff' } }, directLiteral: true }, 'gdscript');
  expect(analyzeNativeConstantGraph(direct.doc, direct.rootId, 'gdscript').fact.payload).toBe('-9223372036854775808');
  grouped.doc.nodes[0].data.properties!.directLiteral = true;
  expect(analyzeNativeConstantGraph(grouped.doc, grouped.rootId, 'gdscript').fact.payload).toBe('-9223372036854775807');
});
