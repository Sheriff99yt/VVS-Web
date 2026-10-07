import { expect, test } from 'bun:test';
import savedExpression from '../test/csharp-expression.fixture.json';
import type { CodegenContext } from './generate';
import { CSHARP_GRAPH_EXPRESSIONS, csharpExpressionGraph, type CSharpExprSpec } from '../test/csharpExpressionGraphs';
import { transpileGraph } from './generate';
import { inferCSharpGraphExpression, nativeSignature } from '@vvs/graph-types';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';

for (const spec of CSHARP_GRAPH_EXPRESSIONS) test(`C# graph expression matches native compiler facts and survives reload: ${spec.id}`, () => {
  const graph = csharpExpressionGraph(spec); const doc = graph.documents!['identity-int'];
  const definition = graph.nodes.find(node => node.id === 'identity-int-define')!;
  const edge = doc.edges.find(edge => edge.target === 'identity-int-return' && edge.targetHandle === 'return_val')!;
  const fact = inferCSharpGraphExpression(doc, nativeSignature(definition.data)!, 'identity-int-entry', edge.source, edge.sourceHandle!);
  const native = evidence.observations.find(row => row.id === `generated-expression-${spec.id}`)!;
  expect(native).toBeDefined(); expect(native.ok).toBe(true);
  expect(fact.type).toBe(native.expressionType); expect(fact.constant !== undefined).toBe(native.constantAvailable);
  if (fact.constant !== undefined) expect(fact.constant).toBe(native.constant);
  const result = transpileGraph(graph); const code = result.files[0].content;
  expect(transpileGraph(JSON.parse(JSON.stringify(graph))).files[0].content).toBe(code);
  for (const node of doc.nodes.filter(node => node.data.kindId?.startsWith('expr_native'))) expect(result.sourceMap[node.id]?.length).toBeGreaterThan(0);
  graph.documents!['main-graph'] = { nodes: graph.nodes, edges: graph.edges };
  const preview = transpileGraph({ ...graph, nodes: doc.nodes, edges: doc.edges, tabId: 'identity-int' }).files[0].content;
  expect(preview.slice(preview.indexOf('return '))).toBe(code.slice(code.indexOf('return '), code.lastIndexOf('}')).trimEnd());
});
test('C# graph expression mutations block bad overflow, cycles, hidden inline operands and orphan values', () => {
  const spec = CSHARP_GRAPH_EXPRESSIONS.find(spec => spec.id === 'unchecked-overflow')!;
  for (const mutate of [
    (graph: ReturnType<typeof csharpExpressionGraph>) => { graph.documents!['identity-int'].nodes.find(n => n.data.properties?.nativeForm === 'overflow')!.data.properties!.payload = 'checked'; },
    (graph: ReturnType<typeof csharpExpressionGraph>) => { const op = graph.documents!['identity-int'].nodes.find(n => n.data.properties?.nativeForm === 'binary')!; op.data.inlineValues['operand-0'] = 1; },
    (graph: ReturnType<typeof csharpExpressionGraph>) => { const doc = graph.documents!['identity-int']; const edge = doc.edges.find(e => e.targetHandle === 'operand-0')!; edge.source = edge.target; edge.sourceHandle = 'result'; },
    (graph: ReturnType<typeof csharpExpressionGraph>) => { const doc = graph.documents!['identity-int']; const value = structuredClone(doc.nodes.find(n => n.data.kindId === 'expr_native_literal')!); value.id = 'orphan'; doc.nodes.push(value); },
  ]) { const graph = csharpExpressionGraph(spec); mutate(graph); expect(() => transpileGraph(graph)).toThrow('NATIVE_'); }
});

test('fixed saved C# overflow/cast graph uses the canonical output path', () => {
  const result = transpileGraph(structuredClone(savedExpression) as CodegenContext);
  expect(result.files[0].content).toContain('return unchecked(((byte)256));');
  for (const id of ['expression-0', 'expression-1', 'expression-2']) expect(result.sourceMap[id]?.length).toBeGreaterThan(0);
});

test('C# native expressions cannot bypass body inference by removing the reviewed signature', () => {
  const graph = csharpExpressionGraph(CSHARP_GRAPH_EXPRESSIONS[0]);
  const properties = graph.nodes.find(node => node.id === 'identity-int-define')!.data.properties!;
  delete properties.nativeSignatureLanguage; delete properties.nativeParameters; delete properties.nativeReturnType;
  expect(() => transpileGraph(graph)).toThrow('NATIVE_CSHARP_EXPRESSION_OWNER');
});
