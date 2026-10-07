import { expect, test } from 'bun:test';
import { planCSharpIntegralClass } from './csharpPlan';
import { materializeImportPlan } from './materialize';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
import { transpileProject } from '@vvs/transpiler';
import { CSHARP_GRAPH_EXPRESSIONS, csharpExpressionGraph } from '../../transpiler/test/csharpExpressionGraphs';
import { transpileGraph } from '@vvs/transpiler';
import { inferCSharpGraphExpression, nativeSignature, normalizeProjectSnapshot } from '@vvs/graph-types';
import savedClass from '../test/native-csharp-class.fixture.json';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
configureCSharpTestRuntime();
for (const spec of CSHARP_GRAPH_EXPRESSIONS) test(`C# source plan/materialized graph retains native expression facts: ${spec.id}`, async () => {
  const original = transpileGraph(csharpExpressionGraph(spec)).files[0].content.replace(/^\s*\/\/[^\n]*\n/gm, '');
  const plan = await planCSharpIntegralClass(original, 'Example.cs');
  const snapshot = materializeImportPlan(plan);
  const home = snapshot.documents['main-graph']; const owner = home.nodes.find(n => n.data.kindId === 'function_implement')!;
  const body = snapshot.documents[snapshot.functions[0].id]; const entry = body.nodes.find(n => n.data.kindId === 'function_entry')!;
  const ret = body.nodes.find(n => n.data.kindId === 'flow_return')!;
  const edge = body.edges.find(e => e.target === ret.id && e.targetHandle === 'return_val')!;
  const fact = inferCSharpGraphExpression(body, nativeSignature(owner.data)!, entry.id, edge.source, edge.sourceHandle!);
  const native = evidence.observations.find(row => row.id === `generated-expression-${spec.id}`)!;
  expect(fact.type).toBe(native.expressionType); expect(fact.constant !== undefined).toBe(native.constantAvailable); if (fact.constant !== undefined) expect(fact.constant).toBe(native.constant);
  const result = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  expect(result.files.some(file => file.content.includes('public static'))).toBe(true);
  expect(transpileProject({ ...JSON.parse(JSON.stringify(snapshot)), projectEvents: snapshot.events }).files).toEqual(result.files);
  for (const doc of Object.values(snapshot.documents)) for (const node of doc.nodes.filter(n => !['function_entry', 'function_define'].includes(n.data.kindId ?? ''))) expect(result.sourceMap[node.id]?.length, node.id).toBeGreaterThan(0);
});
test('C# materialization supports public methods, escaped/case-sensitive params, empty and explicit void return', async () => {
  const source = 'public class Sample { public static int Identity(int @Value) => Value; public static void Empty(byte value) {} public static void Done() { return; } }';
  const plan = await planCSharpIntegralClass(source, 'Sample.cs'); const snapshot = materializeImportPlan(plan);
  const code = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files.map(file => file.content).join('\n');
  expect(code).toContain('int Identity(int @Value)'); expect(code).toContain('return @Value;'); expect(code).toContain('void Empty(byte value)');
  expect(plan.dependencies[0].symbolId).toBe(plan.methods[0].parameters[0].id);
  expect(snapshot.targetLanguage).toBe('csharp');
});
test('unsupported C# source contexts cannot become partial graphs', async () => {
  for (const source of [
    'public class Sample { public static int Missing() {} }',
    'public class Sample { public static void Bad() { return 1; } }',
    'public class Sample { public static int Sample() { return 1; } }',
    'public static class Sample { public static int Value() { return 1; } }',
    'namespace Test { public class Sample { public static int Value() { return 1; } } }',
    'public class Sample { public static int Value() { int first = 1, second; return second; } }',
    'public class Sample { public static int Value(int n) { return n; } public static int Value(byte n) { return n; } }',
    'public class Sample { public static int Value() { return checked(2147483647 + 1); } }',
  ]) await expect(planCSharpIntegralClass(source, 'Sample.cs')).rejects.toThrow();
});

test('C# omitted class visibility survives graph materialization and reload', async () => {
  const plan = await planCSharpIntegralClass('class Sample { public static int Value() { return 1; } }', 'Sample.cs');
  const snapshot = materializeImportPlan(plan);
  expect(snapshot.classes![0].visibility).toBeUndefined();
  expect(snapshot.documents['main-graph'].nodes.find(n => n.data.kindId === 'class_define')!.data.properties!.visibility).toBe('');
  const normalized = normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!;
  expect(normalized.classes![0].visibility).toBeUndefined();
  const result = transpileProject({ ...normalized, projectEvents: normalized.events });
  expect(result.files[0].content).toContain('class Sample'); expect(result.files[0].content).not.toContain('public class Sample');
});

test('fixed source-planned C# class uses canvas authority after normalized reload', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(savedClass))!;
  for (const doc of Object.values(snapshot.documents)) for (const node of doc.nodes) {
    delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport;
  }
  const result = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  const code = result.files.map(file => file.content).join('\n');
  expect(code).toContain('int Sum(byte First, byte Second)'); expect(code).toContain('checked(');
  expect(code).toContain('byte Narrow(long Value)'); expect(code).toContain('unchecked(');
  expect(code).toContain('(-2147483648)'); expect(code).toContain('void Done()');
});
