import { expect, test } from 'bun:test';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
import { normalizedCSharpSyntax } from './csharpSyntax';
import { reviewCSharpImportGraph, acceptSourceImportReview, validateImportSnapshot, reviewSourceReimport, acceptSourceReimport } from './validation';
import { CSHARP_GRAPH_EXPRESSIONS, csharpExpressionGraph } from '../../transpiler/test/csharpExpressionGraphs';
import { transpileGraph, transpileProject } from '@vvs/transpiler';
import { CSHARP_LOCAL_GRAPHS, csharpLocalGraph } from '../../transpiler/test/csharpLocalGraphs';
import { CSHARP_ASSIGNMENT_CASES } from '../test/csharpAssignmentCases';
import { CSHARP_PARAMETER_WRITE_CASES } from '../test/csharpParameterWriteCases';
import { CSHARP_SCOPE_GRAPH_CASES } from '../test/csharpScopeGraphCases';
import { CSHARP_GROUP_CASES } from '../test/csharpGroupCases';
import { CSHARP_DEFINITE_ASSIGNMENT_CASES } from '../test/csharpDefiniteAssignmentCases';
configureCSharpTestRuntime();

for (const spec of CSHARP_DEFINITE_ASSIGNMENT_CASES) test(`C# definite assignment retains absent initializers through review/reload/reimport: ${spec.id}`, async () => {
  const review = await reviewCSharpImportGraph(spec.source, 'Assignment.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const snapshot = await acceptSourceImportReview(review, spec.source, 'Assignment.cs', false, 'library');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(spec.source));
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(snapshot)), spec.source).generated).toBe(review.generated);
  const incoming = await reviewSourceReimport(snapshot, spec.source, 'Assignment.cs');
  expect(incoming.diagnostics).toEqual([]); expect(acceptSourceReimport(incoming, snapshot, spec.source)).toEqual(snapshot);
});

for (const spec of CSHARP_GROUP_CASES) test(`C# authored declaration group survives sealed review, reload and reimport: ${spec.id}`, async () => {
  const review = await reviewCSharpImportGraph(spec.source, 'Groups.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const snapshot = await acceptSourceImportReview(review, spec.source, 'Groups.cs', false, 'library');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(spec.source));
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(snapshot)), spec.source).generated).toBe(review.generated);
  const incoming = await reviewSourceReimport(snapshot, spec.source, 'Groups.cs');
  expect(incoming.diagnostics).toEqual([]); expect(acceptSourceReimport(incoming, snapshot, spec.source)).toEqual(snapshot);
  const broken = structuredClone(snapshot);
  const declarator = Object.values(broken.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.groupOwnerId)!;
  declarator.data.properties!.groupOwnerId = 'other-group';
  expect(() => validateImportSnapshot(broken, spec.source)).toThrow();
});

for (const spec of CSHARP_SCOPE_GRAPH_CASES) test(`C# lexical scopes retain context, local ownership and return through review/reload/reimport: ${spec.id}`, async () => {
  const review = await reviewCSharpImportGraph(spec.source, 'Scopes.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const snapshot = await acceptSourceImportReview(review, spec.source, 'Scopes.cs', false, 'library');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(spec.source));
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(snapshot)), spec.source).generated).toBe(review.generated);
  const incoming = await reviewSourceReimport(snapshot, spec.source, 'Scopes.cs');
  expect(incoming.diagnostics).toEqual([]); expect(acceptSourceReimport(incoming, snapshot, spec.source)).toEqual(snapshot);
  const badContext = structuredClone(snapshot);
  Object.values(badContext.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'csharp_scope')!.data.properties!.overflowContext = 'bogus';
  expect(() => validateImportSnapshot(badContext, spec.source)).toThrow();
  const stripped = structuredClone(snapshot);
  for (const doc of Object.values(stripped.documents)) for (const node of doc.nodes) delete node.data.properties?.sourceOrigin;
  expect(transpileProject({ ...stripped, projectEvents: stripped.events }).files[0].content).toBe(review.generated);
});

for (const spec of CSHARP_PARAMETER_WRITE_CASES) test(`C# parameter write binds its own signature through review/reload/reimport: ${spec.id}`, async () => {
  const review = await reviewCSharpImportGraph(spec.source, 'Parameters.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const snapshot = await acceptSourceImportReview(review, spec.source, 'Parameters.cs', false, 'library');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(spec.source));
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(snapshot)), spec.source).generated).toBe(review.generated);
  const incoming = await reviewSourceReimport(snapshot, spec.source, 'Parameters.cs');
  expect(incoming.diagnostics).toEqual([]); expect(acceptSourceReimport(incoming, snapshot, spec.source)).toEqual(snapshot);
  for (const key of ['parameterId', 'overloadId', 'symbolId', 'parameterName'] as const) {
    const broken = structuredClone(snapshot);
    const setter = Object.values(broken.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'parameter_set')!;
    if (key === 'parameterName') setter.data.properties!.parameterName = 'Unrelated';
    else setter.data.graphBinding![key] = 'unrelated';
    expect(() => validateImportSnapshot(broken, spec.source)).toThrow();
  }
});

for (const spec of CSHARP_ASSIGNMENT_CASES) test(`C# assignment source retains ordering, width and binding ownership: ${spec.id}`, async () => {
  const review = await reviewCSharpImportGraph(spec.source, 'Assignments.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const snapshot = await acceptSourceImportReview(review, spec.source, 'Assignments.cs', false, 'library');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(spec.source));
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(snapshot)), spec.source).generated).toBe(review.generated);
  const reimport = await reviewSourceReimport(snapshot, spec.source, 'Assignments.cs');
  expect(reimport.diagnostics).toEqual([]);
  expect(acceptSourceReimport(reimport, snapshot, spec.source)).toEqual(snapshot);
  for (const change of [
    (node: { data: { properties?: Record<string, unknown> } }) => { node.data.properties!.variableName = 'Other'; },
    (node: { data: { properties?: Record<string, unknown> } }) => { node.data.properties!.assignmentOperator = '&^='; },
  ]) {
    const broken = structuredClone(snapshot);
    const assignment = Object.values(broken.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'variable_set')!;
    change(assignment); expect(() => validateImportSnapshot(broken, spec.source)).toThrow();
  }
  for (const mutation of ['inline', 'pin', 'readonly'] as const) {
    const broken = structuredClone(snapshot);
    const doc = broken.documents[broken.functions[0].id];
    const assignment = doc.nodes.find(node => node.data.kindId === 'variable_set')!;
    if (mutation === 'inline') assignment.data.inlineValues.val = 1;
    if (mutation === 'pin') assignment.data.inputs.find(pin => pin.id === 'val')!.type = 'data_any';
    if (mutation === 'readonly') {
      const declaration = doc.nodes.find(node => node.data.properties?.symbolId === assignment.data.graphBinding?.symbolId && node.data.kindId === 'var_define')!;
      Object.assign(declaration.data.properties!, { nativeLocalStyle: 'csharp-const', isConst: true, declarationKind: 'const' });
      broken.variables.find(variable => variable.id === assignment.data.graphBinding?.symbolId)!.flags = { readonly: true };
    }
    expect(() => validateImportSnapshot(broken, spec.source)).toThrow();
  }
});

test('C# local assignment rejects readonly, forward, implicit narrowing and effectful expression contexts', async () => {
  for (const body of [
    'const int Value = 0; Value = 1; return Value;',
    'Value = 1; int Value = 0; return Value;',
    'byte Value = 0; Value = 256; return Value;',
    'byte Value = 0; Value = Input; return Value;',
    'byte Value = 0; Value += Input; return Value;',
    'byte Value = 0; Value += 256; return Value;',
    'const int Value = 0; Value++; return Value;',
    'int Value = 0; var Other = (Value = 1); return Other;',
  ]) {
    const source = `class Assignments { public static int Change(int Input) { ${body} } }`;
    const review = await reviewCSharpImportGraph(source, 'Assignments.cs');
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0);
  }
});

test('C# void local completion keeps authored absence of return through acceptance and reimport', async () => {
  const source = 'class Sample { public static void Complete(byte Value) { const byte First = unchecked((byte)256); var Second = First; int Third = Value + Second; } }';
  const review = await reviewCSharpImportGraph(source, 'Sample.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const accepted = await acceptSourceImportReview(review, source, 'Sample.cs', false, 'library');
  const body = accepted.documents[accepted.functions[0].id];
  expect(body.nodes.some(node => node.data.kindId === 'flow_return')).toBe(false);
  expect(body.nodes.filter(node => node.data.kindId === 'var_define')).toHaveLength(3);
  expect(review.generated).not.toContain('return;');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(source));
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(accepted)), source).generated).toBe(review.generated);
  const incoming = source.replace('256', '257');
  const reimport = await reviewSourceReimport(accepted, incoming, 'Sample.cs');
  expect(reimport.diagnostics).toEqual([]);
  expect(validateImportSnapshot(acceptSourceReimport(reimport, accepted, incoming), incoming).generated).toContain('257');
  const broken = structuredClone(accepted);
  const doc = broken.documents[broken.functions[0].id];
  doc.edges = doc.edges.filter(edge => edge.data?.pinType !== 'execution');
  expect(() => validateImportSnapshot(broken, source)).toThrow();
  const integral = structuredClone(accepted);
  integral.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!.data.properties!.nativeReturnType = 'int';
  expect(() => validateImportSnapshot(integral, source)).toThrow();
});

for (const spec of CSHARP_LOCAL_GRAPHS) test(`C# local source has sealed visible declarations and reload fidelity: ${spec.id}`, async () => {
  const source = transpileGraph(csharpLocalGraph(spec)).files[0].content.replace(/^\s*\/\/[^\n]*\n/gm, '');
  const review = await reviewCSharpImportGraph(source, 'Locals.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  const accepted = await acceptSourceImportReview(review, source, 'Locals.cs', false, 'library');
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(source));
  expect(accepted.variables.length).toBe(spec.chain ? 3 : 1);
  expect(accepted.variables[0].flags?.readonly ?? false).toBe(spec.constant);
  expect(validateImportSnapshot(JSON.parse(JSON.stringify(accepted)), source).generated).toBe(review.generated);
  const edited = structuredClone(accepted);
  const declaration = Object.values(edited.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define')!;
  declaration.data.properties!.nativeType = 'sbyte';
  expect(() => validateImportSnapshot(edited, source)).toThrow();
});

for (const spec of CSHARP_GRAPH_EXPRESSIONS) test(`C# sealed review independently validates composed graph: ${spec.id}`, async () => {
  const source = transpileGraph(csharpExpressionGraph(spec)).files[0].content.replace(/^\s*\/\/[^\n]*\n/gm, '');
  const review = await reviewCSharpImportGraph(source, 'Expression.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  expect(normalizedCSharpSyntax(review.generated)).toBe(normalizedCSharpSyntax(source));
  const accepted = await acceptSourceImportReview(review, source, 'Expression.cs', false, 'library');
  expect(accepted).toEqual(review.snapshot); expect(accepted).not.toBe(review.snapshot);
  expect(validateImportSnapshot(accepted, source).generated).toBe(review.generated);
});

test('C# structural gate distinguishes native context, signature and expression changes', async () => {
  const wrap = (expression: string) => `class Sample { public static long Value() => ${expression}; }`;
  await reviewCSharpImportGraph(wrap('1'), 'Sample.cs'); // Load the pinned grammar.
  for (const [before, after] of [
    ['-2147483648', '-(2147483648)'], ['-2_147_483_648', '-(2_147_483_648)'],
    ['-0x80000000', '-(0x80000000)'], ['-9223372036854775808L', '-(9223372036854775808L)'],
    ['checked((byte)256)', 'unchecked((byte)256)'], ['(int)1', '(long)1'],
    ['1U', '1'], ['1 + (2 * 3)', '(1 + 2) * 3'], ['1 << 33', '1 >> 33'],
  ]) expect(normalizedCSharpSyntax(wrap(before))).not.toBe(normalizedCSharpSyntax(wrap(after)));
  expect(normalizedCSharpSyntax(wrap('((1 + 2))'))).toBe(normalizedCSharpSyntax('class Sample { public static long Value() { return (1 + 2); } }'));
  const signature = 'class Sample { public static int Value(byte First) => First; }';
  for (const changed of [signature.replace('byte First', 'int First'), signature.replace('static int', 'static long'), signature.replaceAll('First', 'first'), signature.replace('class Sample', 'public class Sample')]) expect(normalizedCSharpSyntax(signature)).not.toBe(normalizedCSharpSyntax(changed));
});

test('C# local declaration spelling and order remain structural authority', async () => {
  const source = 'class Sample { public static int Value() { const int First = 1; var Second = First; return Second; } }';
  await reviewCSharpImportGraph(source, 'Sample.cs');
  for (const changed of [source.replace('const int', 'int'), source.replace('var Second', 'int Second'), source.replaceAll('First', 'first'), source.replace('= 1', '= 2')]) {
    expect(normalizedCSharpSyntax(source)).not.toBe(normalizedCSharpSyntax(changed));
  }
});

test('C# local reimport retains graph edits and resolves independent source changes atomically', async () => {
  const source = 'class Sample { public static int Value() { const int First = 1; var Second = First; return Second; } }';
  const current = (await reviewCSharpImportGraph(source, 'Sample.cs')).snapshot!;
  const literal = Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '1')!;
  literal.data.properties!.payload = '2';
  const before = JSON.stringify(current);
  const unchanged = await reviewSourceReimport(current, source, 'Sample.cs');
  expect(unchanged.diagnostics).toEqual([]); expect(unchanged.conflicts).toEqual([]);
  expect(acceptSourceReimport(unchanged, current, source)).toEqual(current);
  const replacement = source.replace('= 1', '= 3');
  const conflict = await reviewSourceReimport(current, replacement, 'Sample.cs');
  expect(conflict.diagnostics).toEqual([]); expect(conflict.conflicts).toHaveLength(1);
  expect(() => acceptSourceReimport(conflict, current, replacement)).toThrow('REIMPORT_CONFLICT');
  expect(acceptSourceReimport(conflict, current, replacement, 'keep-graph')).toEqual(current);
  const changed = acceptSourceReimport(conflict, current, replacement, 'use-source');
  expect(validateImportSnapshot(changed, replacement).generated).toContain('const int First = 3;');
  expect(JSON.stringify(current)).toBe(before);
});

test('C# review accepts escaped/case-sensitive identity, omitted visibility and void bodies', async () => {
  const source = 'class Sample { public static int Identity(int @Value) => Value; public static void Empty(byte value) {} public static void Done() { return; } }';
  const review = await reviewCSharpImportGraph(source, 'Sample.cs');
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  expect(review.generated).toContain('int Identity(int @Value)');
});

test('C# receipts reject changed source, path, options, graph and forged review', async () => {
  const source = 'class Sample { public static byte Value() => unchecked((byte)256); }';
  const review = await reviewCSharpImportGraph(source, 'Sample.cs'); expect(review.snapshot).toBeDefined();
  for (const [text, path, start, policy] of [
    [source + ' ', 'Sample.cs', false, 'library'], [source, 'Other.cs', false, 'library'],
    [source, 'Sample.cs', true, 'library'], [source, 'Sample.cs', false, 'program'],
  ] as const) await expect(acceptSourceImportReview(review, text, path, start, policy)).rejects.toThrow('changed');
  await expect(acceptSourceImportReview({ ...review }, source, 'Sample.cs', false, 'library')).rejects.toThrow('changed');
  review.snapshot!.name = 'Changed';
  await expect(acceptSourceImportReview(review, source, 'Sample.cs', false, 'library')).rejects.toThrow('changed');
});

test('C# edited graph must pass analysis and comparison independently of its receipt', async () => {
  const source = 'class Sample { public static int Value() => unchecked(2147483647 + 1); }';
  const review = await reviewCSharpImportGraph(source, 'Sample.cs'); expect(review.snapshot).toBeDefined();
  const changed = structuredClone(review.snapshot!);
  const wrapper = Object.values(changed.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.nativeForm === 'overflow')!;
  wrapper.data.properties!.payload = 'checked';
  expect(() => validateImportSnapshot(changed, source)).toThrow();
  wrapper.data.properties!.payload = 'unchecked';
  const literal = Object.values(changed.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '1')!;
  literal.data.properties!.payload = '2';
  expect(() => validateImportSnapshot(changed, source)).toThrow('differs structurally');
});

test('unsupported whole units and entry contexts cannot obtain C# receipts', async () => {
  const supported = 'class Sample { public static int Value() => 1; }';
  for (const source of [
    'namespace Demo { ' + supported + ' }', supported + '\nclass Other {}',
    'class Sample { public static int Value() { int first = 1, second; return second; } }',
    'class Sample { public static int Value() => checked(2147483647 + 1); }',
    '// authored comment\n' + supported,
  ]) { const review = await reviewCSharpImportGraph(source, 'Sample.cs'); expect(review.snapshot).toBeUndefined(); expect(review.issues?.length).toBeGreaterThan(0); }
  for (const [path, start, policy] of [['../Sample.cs', false, 'library'], ['Sample.cs', true, 'library'], ['Sample.cs', false, 'program']] as const) {
    const review = await reviewCSharpImportGraph(supported, path, start, policy); expect(review.snapshot).toBeUndefined();
  }
});

test('C# three-way reimport preserves graph-only changes and requires explicit conflict resolution', async () => {
  const source = 'class Sample { public static int Value() => 1; }';
  const imported = await reviewCSharpImportGraph(source, 'Sample.cs');
  const current = await acceptSourceImportReview(imported, source, 'Sample.cs', false, 'library');
  const literal = Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '1')!;
  literal.data.properties!.payload = '2';
  const before = JSON.stringify(current);
  const unchanged = await reviewSourceReimport(current, source, 'Sample.cs');
  expect(unchanged.diagnostics).toEqual([]); expect(unchanged.conflicts).toEqual([]);
  expect(acceptSourceReimport(unchanged, current, source)).toEqual(current);
  const replacement = source.replace('=> 1', '=> 3');
  const conflict = await reviewSourceReimport(current, replacement, 'Sample.cs');
  expect(conflict.diagnostics).toEqual([]); expect(conflict.conflicts).toHaveLength(1);
  expect(() => acceptSourceReimport(conflict, current, replacement)).toThrow('REIMPORT_CONFLICT');
  expect(acceptSourceReimport(conflict, current, replacement, 'keep-graph')).toEqual(current);
  expect(validateImportSnapshot(acceptSourceReimport(conflict, current, replacement, 'use-source'), replacement).generated).toContain('return 3;');
  expect(JSON.stringify(current)).toBe(before);
  conflict.conflicts.length = 0;
  expect(() => acceptSourceReimport(conflict, current, replacement, 'use-source')).toThrow('STALE_REIMPORT');
});

test('C# reimport rejects unsupported additions, invalid graph edits and unreviewed units atomically', async () => {
  const source = 'class Sample { public static int Value() => 1; }';
  const imported = await reviewCSharpImportGraph(source, 'Sample.cs'); const current = imported.snapshot!;
  for (const replacement of [source + '\nclass Other {}', '// new comment\n' + source, 'class Sample { public static int Value() { int first = 1, second; return second; } }']) {
    const before = JSON.stringify(current); const review = await reviewSourceReimport(current, replacement, 'Sample.cs');
    expect(review.diagnostics.length).toBeGreaterThan(0);
    expect(() => acceptSourceReimport(review, current, replacement)).toThrow('STALE_REIMPORT');
    expect(JSON.stringify(current)).toBe(before);
  }
  const broken = structuredClone(current);
  const literal = Object.values(broken.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '1')!;
  literal.data.properties!.payload = '18446744073709551615UL';
  expect((await reviewSourceReimport(broken, source, 'Sample.cs')).diagnostics.length).toBeGreaterThan(0);
  const authored = structuredClone(current);
  delete authored.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!.data.properties!.sourceOrigin;
  expect((await reviewSourceReimport(authored, source, 'Sample.cs')).diagnostics.join()).toContain('Additional authored units');
});

test('C# reimport comparison retains graph comments instead of silently replacing them', async () => {
  const source = 'class Sample { public static int Value() => 1; }';
  const current = (await reviewCSharpImportGraph(source, 'Sample.cs')).snapshot!;
  const body = current.documents[current.functions[0].id];
  body.nodes.push({ id: 'authored-comment', type: 'vvs_comment_node', position: { x: 10, y: 10 }, data: { label: 'Comment', category: 'Comment', inputs: [], outputs: [], inlineValues: {}, properties: { commentText: 'keep authored explanation' } } });
  const review = await reviewSourceReimport(current, source, 'Sample.cs');
  expect(review.diagnostics).toEqual([]); expect(review.current).toContain('keep authored explanation');
  expect(acceptSourceReimport(review, current, source)).toEqual(current);
});
