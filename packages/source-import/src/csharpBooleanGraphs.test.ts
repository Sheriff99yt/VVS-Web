import { expect, test } from 'bun:test';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
import { CSHARP_BOOLEAN_GRAPH_CASES } from '../test/csharpBooleanGraphCases';
import { reviewCSharpImportGraph, acceptSourceImportReview, reviewSourceReimport, acceptSourceReimport } from './validation';
import { transpileProject } from '@vvs/transpiler';
import { inferCSharpGraphValueExpression, inferCSharpGraphExpression, inferCSharpLinearLocals, nativeSignature, applyFunctionImplementBinding } from '@vvs/graph-types';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
configureCSharpTestRuntime();
for (const spec of CSHARP_BOOLEAN_GRAPH_CASES) test(`Boolean native graph admission and lifecycle: ${spec.id}`, async () => {
  const review = await reviewCSharpImportGraph(spec.source, 'BooleanGraph.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const snapshot = await acceptSourceImportReview(review, spec.source, 'BooleanGraph.cs', false, 'library');
  const reimport = await reviewSourceReimport(JSON.parse(JSON.stringify(snapshot)), spec.source, 'BooleanGraph.cs');
  expect(reimport.diagnostics).toEqual([]); expect(acceptSourceReimport(reimport, snapshot, spec.source)).toEqual(snapshot);
  const fn = snapshot.functions[0], doc = snapshot.documents[fn.id];
  const definition = snapshot.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
  expect(applyFunctionImplementBinding(definition.data, fn).properties?.nativeReturnType).toBe('bool');
  const entry = doc.nodes.find(node => node.data.kindId === 'function_entry')!, ret = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
  const edge = doc.edges.find(edge => edge.target === ret.id && edge.targetHandle === 'return_val')!;
  const locals = inferCSharpLinearLocals(doc, nativeSignature(definition.data)!, entry.id);
  const fact = inferCSharpGraphValueExpression(doc, nativeSignature(definition.data)!, entry.id, edge.source, edge.sourceHandle!, locals.overflowContext, locals.visited, new Set(), locals.bindings);
  const native = evidence.observations.find(row => row.id === `compiled-boolean-graph-${spec.id}-1`)!;
  expect(native?.ok).toBe(true); expect(fact.type).toBe(native.expressionType);
  expect(fact.constant !== undefined).toBe(native.constantAvailable);
  if (fact.constant !== undefined) expect(String(fact.constant)).toBe(native.constant);
  expect(() => inferCSharpGraphExpression(doc, nativeSignature(definition.data)!, entry.id, edge.source, edge.sourceHandle!, locals.overflowContext, new Set(), new Set(), locals.bindings)).toThrow('INTEGER_DOMAIN');
  const original = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  expect(original.files[0].content).toContain('public static bool Test(');
  for (const node of doc.nodes.filter(node => node.data.kindId?.startsWith('expr_native'))) expect(original.sourceMap[node.id]?.length).toBeGreaterThan(0);
  for (const document of Object.values(snapshot.documents)) for (const node of document.nodes) { delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport; }
  expect(transpileProject({ ...snapshot, projectEvents: snapshot.events }).files).toEqual(original.files);
});
test('Boolean graph mutations reject eager unassigned reads, wrong result domains and hidden operands', async () => {
  const spec = CSHARP_BOOLEAN_GRAPH_CASES.find(spec => spec.id === 'short-circuit')!;
  const review = await reviewCSharpImportGraph(spec.source, 'BooleanGraph.cs');
  expect(review.snapshot).toBeDefined();
  for (const mutate of [
    (snapshot: NonNullable<typeof review.snapshot>) => { const root = snapshot.documents[snapshot.functions[0].id].nodes.find(node => node.data.properties?.operator === '&&')!; root.data.properties!.operator = '&'; },
    (snapshot: NonNullable<typeof review.snapshot>) => { const root = snapshot.documents[snapshot.functions[0].id].nodes.find(node => node.data.properties?.operator === '>')!; root.data.properties!.nativeDomain = 'csharp-integer'; },
    (snapshot: NonNullable<typeof review.snapshot>) => { const root = snapshot.documents[snapshot.functions[0].id].nodes.find(node => node.data.properties?.operator === '&&')!; root.data.inlineValues = { 'operand-0': false }; },
  ]) { const snapshot = structuredClone(review.snapshot!); mutate(snapshot); expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow(); }
});
