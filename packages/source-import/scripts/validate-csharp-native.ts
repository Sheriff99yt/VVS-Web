import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import pins from '../test/native-csharp/pins.json';
import sourceFixtures from '../test/native-csharp/cases.json';
import browserClass from '../test/csharp-import-browser.fixture.json';
import { CSHARP_ASSIGNMENT_CASES } from '../test/csharpAssignmentCases';
import { CSHARP_PARAMETER_WRITE_CASES } from '../test/csharpParameterWriteCases';
import { CSHARP_SCOPE_CASES } from '../test/csharpScopeCases';
import { CSHARP_SCOPE_GRAPH_CASES } from '../test/csharpScopeGraphCases';
import { CSHARP_GROUP_CASES, CSHARP_GROUP_REJECTIONS } from '../test/csharpGroupCases';
import { CSHARP_DEFINITE_ASSIGNMENT_CASES, CSHARP_DEFINITE_ASSIGNMENT_PROBES } from '../test/csharpDefiniteAssignmentCases';
import { CSHARP_BRANCH_CASES } from '../test/csharpBranchCases';
import { CSHARP_BOOLEAN_GRAPH_CASES } from '../test/csharpBooleanGraphCases';
import { csharpBooleanProbes, evaluateCSharpBooleanProbe, type CSharpBooleanProbe } from '../test/csharpBooleanProbes';
import { csharpMutationCases, type CSharpMutationProbe } from '../test/csharpMutationProbes';
import { csharpIntegralMutation } from '@vvs/graph-types';
import { CSHARP_LOCAL_GRAPHS, csharpLocalGraph } from '../../transpiler/test/csharpLocalGraphs';
import { inferCSharpLinearLocals, inferCSharpLocalForEdit, csharpLocalStylePatch, type CSharpLocalStyle } from '@vvs/graph-types';
import signatureGraph from '../../transpiler/test/csharp-signature.fixture.json';
import { transpileGraph, transpileProject, type CodegenContext } from '@vvs/transpiler';
import { CSHARP_GRAPH_EXPRESSIONS, csharpExpressionGraph } from '../../transpiler/test/csharpExpressionGraphs';
import { inferCSharpGraphExpression, nativeSignature } from '@vvs/graph-types';
import { reviewCSharpImportGraph, acceptSourceImportReview, reviewSourceReimport, acceptSourceReimport } from '../src/validation';
configureCSharpTestRuntime();
const graphCases = (await Promise.all(CSHARP_GRAPH_EXPRESSIONS.map(async spec => {
  const graph = csharpExpressionGraph(spec); const source = transpileGraph(graph).files[0].content;
  const doc = graph.documents!['identity-int']; const definition = graph.nodes.find(node => node.id === 'identity-int-define')!;
  const edge = doc.edges.find(edge => edge.target === 'identity-int-return' && edge.targetHandle === 'return_val')!;
  const fact = inferCSharpGraphExpression(doc, nativeSignature(definition.data)!, 'identity-int-entry', edge.source, edge.sourceHandle!);
  const authored = source.replace(/^\s*\/\/[^\n]*\n/gm, '');
  const review = await reviewCSharpImportGraph(authored, 'Expression.cs');
  if (!review.snapshot) throw new Error(`C# source graph review ${spec.id}: ${review.diagnostics.join('; ')}`);
  const accepted = await acceptSourceImportReview(review, authored, 'Expression.cs', false, 'library');
  const reimport = await reviewSourceReimport(accepted, authored, 'Expression.cs');
  if (reimport.diagnostics.length) throw new Error(`C# source graph reimport ${spec.id}: ${reimport.diagnostics.join('; ')}`);
  const snapshot = acceptSourceReimport(reimport, accepted, authored);
  const importedSource = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content;
  const importedProbe = importedSource.replace(/return ([^\r\n]+);/, 'var observed = $1; return observed;');
  const importedExpected = { ok: true, expressionType: fact.type, convertedType: fact.type, declaredType: fact.type, constantAvailable: fact.constant !== undefined, ...(fact.constant !== undefined ? { constant: fact.constant } : {}) };
  const probe = source.replace(/return ([^\r\n]+);/, 'var observed = $1; return observed;');
  if (probe === source) throw new Error('Generated C# graph probe has no return.');
  return [{ id: `generated-expression-${spec.id}`, files: [{ path: 'Expression.cs', source: probe }], expected: { ok: true, expressionType: fact.type, convertedType: fact.type, declaredType: fact.type, constantAvailable: fact.constant !== undefined, ...(fact.constant !== undefined ? { constant: fact.constant } : {}) } },
    { id: `imported-expression-${spec.id}`, files: [{ path: 'Imported.cs', source: importedProbe }], expected: importedExpected },
    { id: `compiled-imported-expression-${spec.id}`, files: [{ path: 'Imported.cs', source: importedSource + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } },
    { id: `compiled-expression-${spec.id}`, files: [{ path: 'Expression.cs', source: source + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } }];
}))).flat();
const signatureSource = transpileGraph(structuredClone(signatureGraph) as CodegenContext).files[0].content;
const browserReview = await reviewCSharpImportGraph(browserClass.source, browserClass.fileName);
if (!browserReview.snapshot) throw new Error(browserReview.diagnostics.join('\n'));
const browserSnapshot = await acceptSourceImportReview(browserReview, browserClass.source, browserClass.fileName, false, 'library');
const browserSource = transpileProject({ ...browserSnapshot, projectEvents: browserSnapshot.events }).files[0].content;
const localCases = (await Promise.all(CSHARP_LOCAL_GRAPHS.map(async spec => {
  const graph = csharpLocalGraph(spec); const doc = graph.documents!['identity-int'];
  const signature = nativeSignature(graph.nodes.find(node => node.id === 'identity-int-define')!.data)!;
  const locals = inferCSharpLinearLocals(doc, signature, 'identity-int-entry');
  const edge = doc.edges.find(edge => edge.target === locals.returnId && edge.targetHandle === 'return_val')!;
  const fact = inferCSharpGraphExpression(doc, signature, 'identity-int-entry', edge.source, edge.sourceHandle!, 'default', locals.visited, new Set(), locals.bindings);
  const source = transpileGraph(graph).files[0].content;
  const authored = source.replace(/^\s*\/\/[^\n]*\n/gm, '');
  const review = await reviewCSharpImportGraph(authored, 'Locals.cs');
  if (!review.snapshot) throw new Error(`C# local review ${spec.id}: ${review.diagnostics.join('; ')}`);
  const accepted = await acceptSourceImportReview(review, authored, 'Locals.cs', false, 'library');
  const reimport = await reviewSourceReimport(accepted, authored, 'Locals.cs');
  if (reimport.diagnostics.length) throw new Error(`C# local reimport ${spec.id}: ${reimport.diagnostics.join('; ')}`);
  const snapshot = acceptSourceReimport(reimport, accepted, authored);
  const imported = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content;
  return [{ id: `compiled-local-${spec.id}`, files: [{ path: 'Locals.cs', source: source + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } },
    { id: `compiled-imported-local-${spec.id}`, files: [{ path: 'Locals.cs', source: imported + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } },
    { id: `imported-local-fact-${spec.id}`, files: [{ path: 'Locals.cs', source: imported.replace(/return ([^\r\n]+);/, 'var observed = $1; return observed;') }], expected: { ok: true, expressionType: fact.type, convertedType: fact.type, declaredType: fact.type, constantAvailable: fact.constant !== undefined, ...(fact.constant !== undefined ? { constant: fact.constant } : {}) } },
    { id: `local-fact-${spec.id}`, files: [{ path: 'Locals.cs', source: source.replace(/return ([^\r\n]+);/, 'var observed = $1; return observed;') }], expected: { ok: true, expressionType: fact.type, convertedType: fact.type, declaredType: fact.type, constantAvailable: fact.constant !== undefined, ...(fact.constant !== undefined ? { constant: fact.constant } : {}) } }];
}))).flat();
const styleCases = (await Promise.all((['csharp-typed', 'csharp-var', 'csharp-const'] as CSharpLocalStyle[]).map(async style => {
  const graph = csharpLocalGraph(CSHARP_LOCAL_GRAPHS[0]);
  const doc = graph.documents!['identity-int'];
  const index = style === 'csharp-const' ? 1 : 0;
  const declaration = doc.nodes.find(node => node.id === `local-${index}-define`)!;
  const type = inferCSharpLocalForEdit(doc, [], 'identity-int-entry', declaration.id).type;
  const patch = csharpLocalStylePatch(declaration.data.properties!, style, type);
  Object.assign(declaration.data.properties!, patch); graph.variables[index].flags!.readonly = patch.isConst;
  const original = transpileGraph(graph).files[0].content.replace(/^\s*\/\/[^\n]*\n/gm, '');
  const review = await reviewCSharpImportGraph(original, 'Styles.cs');
  if (!review.snapshot) throw new Error(`C# style review ${style}: ${review.diagnostics.join('; ')}`);
  const accepted = await acceptSourceImportReview(review, original, 'Styles.cs', false, 'library');
  const regenerated = transpileProject({ ...accepted, projectEvents: accepted.events }).files[0].content;
  return [original, regenerated].map((source, index) => ({ id: `compiled-local-style-${style}-${index ? 'regenerated' : 'original'}`, files: [{ path: 'Styles.cs', source: source + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } }));
}))).flat();
const voidCases = (await Promise.all([
  'class Completion { public static void Complete(byte Value) { const byte First = unchecked((byte)256); var Second = First; int Third = Value + Second; } }',
  'class Completion { public static void Complete(char Value) { var First = ~Value; long Second = First; } }',
  'class Completion { public static void Complete(byte Value) { var First = Value + 1; int Second = First; return; } }',
].map(async (source, index) => {
  const review = await reviewCSharpImportGraph(source, 'Completion.cs');
  if (!review.snapshot) throw new Error(`C# void completion ${index}: ${review.diagnostics.join('; ')}`);
  const accepted = await acceptSourceImportReview(review, source, 'Completion.cs', false, 'library');
  const reimport = await reviewSourceReimport(accepted, source, 'Completion.cs');
  if (reimport.diagnostics.length) throw new Error(`C# void completion reimport ${index}: ${reimport.diagnostics.join('; ')}`);
  const snapshot = acceptSourceReimport(reimport, accepted, source);
  const regenerated = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content;
  if (index < 2 && regenerated.includes('return;')) throw new Error('Void fallthrough must not invent a hidden return.');
  return [source, regenerated].map((text, generated) => ({ id: `compiled-void-completion-${index}-${generated ? 'regenerated' : 'original'}`, files: [{ path: 'Completion.cs', source: text + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } }));
}))).flat();
const assignmentCases = (await Promise.all([...CSHARP_ASSIGNMENT_CASES, ...CSHARP_PARAMETER_WRITE_CASES].map(async spec => {
  const review = await reviewCSharpImportGraph(spec.source, 'Assignments.cs');
  if (!review.snapshot) throw new Error(`C# assignment review ${spec.id}: ${review.diagnostics.join('; ')}`);
  const accepted = await acceptSourceImportReview(review, spec.source, 'Assignments.cs', false, 'library');
  const reimport = await reviewSourceReimport(accepted, spec.source, 'Assignments.cs');
  if (reimport.diagnostics.length) throw new Error(`C# assignment reimport ${spec.id}: ${reimport.diagnostics.join('; ')}`);
  const snapshot = acceptSourceReimport(reimport, accepted, spec.source);
  const regenerated = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content;
  return [spec.source, regenerated].flatMap((source, index) => [
    { id: `compiled-assignment-${spec.id}-${index}`, files: [{ path: 'Assignments.cs', source: source + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } },
    { id: `assignment-read-${spec.id}-${index}`, files: [{ path: 'Assignments.cs', source: source.replace(/return (Value|Input);/, 'var observed = $1; return observed;') }], expected: { ok: true, expressionType: spec.type, convertedType: spec.type, declaredType: spec.type, constantAvailable: false } },
  ]);
}))).flat();
const assignmentRejections = [
  'const int Value = 0; Value = 1; return Value;',
  'Value = 1; int Value = 0; return Value;',
  'byte Value = 0; Value = 256; return Value;',
  'byte Value = 0; Value = Input; return Value;',
].map((body, index) => ({ id: `native-assignment-rejection-${index}`, files: [{ path: 'Assignments.cs', source: `class Assignments { public static int Change(int Input) { ${body} } }\nclass NativeWitness { static void Check() { int observed = 0; } }\n` }], expected: { ok: false } }));
const mutationCases = csharpMutationCases();
const scopeGraphCases = (await Promise.all([...CSHARP_SCOPE_GRAPH_CASES, ...CSHARP_GROUP_CASES, ...CSHARP_DEFINITE_ASSIGNMENT_CASES].map(async spec => {
  const review = await reviewCSharpImportGraph(spec.source, 'Scopes.cs');
  if (!review.snapshot) throw new Error(`C# scope review ${spec.id}: ${review.diagnostics.join('; ')}`);
  const snapshot = await acceptSourceImportReview(review, spec.source, 'Scopes.cs', false, 'library');
  const regenerated = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content;
  return [spec.source, regenerated].map((source, index) => ({ id: `compiled-${index ? 'imported' : 'original'}-scope-${spec.id}`, files: [{ path: 'Scopes.cs', source: source + '\nclass NativeWitness { static void Check() { int observed = 0; } }' }], expected: { ok: true } }));
}))).flat();
const booleanCases = csharpBooleanProbes();
const booleanGraphCases = (await Promise.all(CSHARP_BOOLEAN_GRAPH_CASES.map(async spec => {
  const review = await reviewCSharpImportGraph(spec.source, 'BooleanGraph.cs');
  if (!review.snapshot) throw new Error(`C# Boolean review ${spec.id}: ${review.diagnostics.join('; ')}`);
  const snapshot = await acceptSourceImportReview(review, spec.source, 'BooleanGraph.cs', false, 'library');
  const regenerated = transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content;
  return [spec.source, regenerated].map((source, index) => ({ id: `compiled-boolean-graph-${spec.id}-${index}`, files: [{ path: 'BooleanGraph.cs', source: source.replace(/return ([^;]+);/, 'var observed = $1; return observed;').replace(/=> ([^;]+);/, '{ var observed = $1; return observed; }') }], expected: { ok: true, expressionType: 'bool' } }));
}))).flat();
const fixtures = { ...sourceFixtures, cases: [...sourceFixtures.cases, ...CSHARP_SCOPE_CASES, ...CSHARP_GROUP_REJECTIONS, ...CSHARP_DEFINITE_ASSIGNMENT_PROBES, ...CSHARP_BRANCH_CASES, ...booleanCases, ...booleanGraphCases, ...scopeGraphCases, ...graphCases, ...localCases, ...styleCases, ...voidCases, ...assignmentCases, ...assignmentRejections, ...mutationCases,
  ...[browserClass.source, browserSource].map((source, index) => ({ id: index ? 'compiled-browser-imported-class' : 'compiled-browser-original-class', files: [{ path: browserClass.fileName, source: source + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true } })),
  { id: 'generated-integral-signature-graph', files: [{ path: 'IntegralSignatures.cs', source: signatureSource + '\nclass NativeWitness { static void Check() { int observed = 0; } }\n' }], expected: { ok: true, expressionType: 'int', convertedType: 'int', declaredType: 'int', constantAvailable: true, constant: '0' } }] };

import { evaluateCSharpIntegralProbe, type CSharpIntegralProbe } from '../test/csharpIntegralProbes';
import { CSharpIntegerError } from '@vvs/graph-types';
import { analyzeCSharpIntegralBindings } from '../src/csharpBindings';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';

// Trusted compiler oracle. No browser adapter, user assemblies or execution of
// fixture source are involved. Unavailable or changed native tools fail the gate.
const root = join(import.meta.dir, '../../..');
const harness = join(root, 'packages/source-import/test/native-csharp');
const nativeEnvironment = { ...Bun.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1', DOTNET_NOLOGO: '1' };
if (new Set(fixtures.cases.map(fixture => fixture.id)).size !== fixtures.cases.length) throw new Error('Duplicate native C# fixture identities.');
function command(args: string[]): string {
  const result = Bun.spawnSync(args, { cwd: harness, env: nativeEnvironment });
  if (result.exitCode) throw new Error(`Native C# command failed: ${args[0]} ${args[1]}\n${result.stdout.toString()}${result.stderr.toString()}`);
  return result.stdout.toString().trim();
}
if (command(['dotnet', '--version']) !== pins.sdk) throw new Error(`Pinned SDK ${pins.sdk} is required.`);
const sdkLine = command(['dotnet', '--list-sdks']).split(/\r?\n/).find(line => line.startsWith(`${pins.sdk} [`));
const sdkDirectory = sdkLine?.match(/\[([^\]]+)\]/)?.[1];
if (!sdkDirectory) throw new Error('Pinned SDK installation directory is unavailable.');
const dotnetRoot = dirname(sdkDirectory);
const referenceDirectory = join(dotnetRoot, 'packs/Microsoft.NETCore.App.Ref', pins.runtime, 'ref/net9.0');
const roslynDirectory = join(sdkDirectory, pins.sdk, 'Roslyn/bincore');
for (const [directory, inventory] of [[referenceDirectory, pins.references], [roslynDirectory, pins.roslyn]] as const) {
  if (!existsSync(directory)) throw new Error(`Native C# evidence prerequisite unavailable: ${directory}`);
  for (const [name, expected] of Object.entries(inventory)) {
    const bytes = readFileSync(join(directory, name));
    if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`Pinned native assembly changed: ${name}`);
  }
}
if (readdirSync(referenceDirectory).filter(name => name.endsWith('.dll')).length !== Object.keys(pins.references).length) throw new Error('Pinned native reference inventory drift.');
command(['dotnet', 'restore', '--configfile', join(harness, 'NuGet.Config'), '--verbosity', 'quiet']);
command(['dotnet', 'build', '--no-restore', '--configuration', 'Release', '--verbosity', 'quiet', '-p:UseSharedCompilation=false']);
const result = Bun.spawnSync(['dotnet', join(harness, 'bin/Release/net9.0/NativeValidator.dll'), referenceDirectory], {
  cwd: harness, env: nativeEnvironment, stdin: Buffer.from(JSON.stringify(fixtures)),
});
if (result.exitCode) throw new Error(`Native C# oracle failed: ${result.stderr.toString()}`);
const nativeResult = JSON.parse(result.stdout.toString()) as { native: { roslynFileVersion: string; runtime: string; language: string; target: string; nullable: string }; observations: Record<string, unknown>[] };
if (nativeResult.native.roslynFileVersion !== pins.roslynFileVersion || nativeResult.native.runtime !== pins.runtime || nativeResult.native.language !== `CSharp${pins.language}` || nativeResult.native.target.toLowerCase() !== pins.target || nativeResult.native.nullable.toLowerCase() !== pins.nullable) throw new Error('Loaded native Roslyn/runtime/options differ from the pinned profile.');
const observations = nativeResult.observations;
if (observations.length !== fixtures.cases.length) throw new Error('Native C# observation count drift.');
const issues: string[] = [];
configureCSharpTestRuntime();
function match(expected: unknown, actual: unknown, path: string): void {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) { issues.push(`Missing native C# fact: ${path}`); return; }
    for (const [key, value] of Object.entries(expected)) match(value, (actual as Record<string, unknown>)[key], `${path}.${key}`);
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || expected.length !== actual.length) { issues.push(`Native C# inventory drift: ${path}`); return; }
    expected.forEach((value, index) => match(value, actual[index], `${path}[${index}]`));
  } else if (expected !== actual) issues.push(`Native C# contract drift: ${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
for (const [index, fixture] of fixtures.cases.entries()) {
  const actual = observations[index];
  if (actual.id !== fixture.id) issues.push('Native C# fixture identity/order drift.');
  const { requiredErrors, ...expected } = fixture.expected as Record<string, unknown>;
  match(expected, actual, fixture.id);
  if (Array.isArray(requiredErrors) && requiredErrors.some(id => !Array.isArray(actual.errors) || !actual.errors.includes(id))) issues.push(`Native C# rejection diagnostics changed: ${fixture.id}`);
  const booleanProbe = (fixture as unknown as { booleanProbe?: CSharpBooleanProbe }).booleanProbe;
  if (booleanProbe) {
    try {
      const fact = evaluateCSharpBooleanProbe(booleanProbe);
      if (!actual.ok) issues.push(`C# Boolean contract accepts native-invalid ${fixture.id}`);
      else {
        match(fact.type, actual.expressionType, `${fixture.id}.booleanType`);
        match(fact.constant !== undefined, actual.constantAvailable, `${fixture.id}.booleanConstant`);
        if (fact.constant !== undefined) match(fact.constant ? 'true' : 'false', actual.constant, `${fixture.id}.booleanValue`);
      }
    } catch (error) {
      if (!(error instanceof CSharpIntegerError) || actual.ok) issues.push(`C# Boolean contract rejects native-valid ${fixture.id}: ${String(error)}`);
    }
  }
  if ('unresolvedInvalid' in fixture) {
    const binding = await analyzeCSharpIntegralBindings(fixture.files[0].source);
    if (actual.ok || !binding.diagnostics.some(diagnostic => diagnostic.status === 'unsupported')) issues.push(`C# unresolved external-name boundary changed: ${fixture.id}`);
  }
  const mutation = (fixture as unknown as { mutationProbe?: CSharpMutationProbe }).mutationProbe;
  if (mutation) {
    try {
      const fact = csharpIntegralMutation(mutation.type, mutation.readonly, mutation.operator, mutation.value);
      if (!actual.ok) issues.push(`C# mutation accepts native-invalid ${fixture.id}: ${JSON.stringify(actual.errors)}`);
      else {
        match(fact.type, actual.expressionType, `${fixture.id}.mutationResultType`);
        match(false, actual.constantAvailable, `${fixture.id}.mutableConstant`);
      }
    } catch (error) {
      if (!(error instanceof CSharpIntegerError) || actual.ok) issues.push(`C# mutation rejects native-valid ${fixture.id}: ${String(error)}`);
    }
  }
  const probe = (fixture as unknown as { integralProbe?: CSharpIntegralProbe }).integralProbe;
  if (probe) {
    let fact;
    try { fact = evaluateCSharpIntegralProbe(probe); }
    catch (error) {
      if (!(error instanceof CSharpIntegerError)) issues.push(`C# integral contract internal failure: ${fixture.id}: ${String(error)}`);
      if (actual.ok) issues.push(`C# integral contract rejects native-valid ${fixture.id}: ${String(error)}`);
    }
    if (fact) {
      if (!actual.ok) issues.push(`C# integral contract accepts native-invalid ${fixture.id}`);
      else {
        match(fact.type, probe.kind === 'assignment' ? actual.convertedType : actual.expressionType, `${fixture.id}.integralType`);
        match(fact.constant !== undefined, actual.constantAvailable, `${fixture.id}.integralConstantAvailable`);
        if (fact.constant !== undefined) match(fact.constant, actual.constant, `${fixture.id}.integralConstant`);
      }
    }
  }
  if (probe || 'sourceBinding' in fixture) {
    const binding = await analyzeCSharpIntegralBindings(fixture.files[0].source);
    const observation = binding.observations.find(item => item.name === 'observed');
    if ((fixture as unknown as { sourceBinding?: string }).sourceBinding === 'unsupported') {
      if (!actual.ok || !binding.diagnostics.some(diagnostic => diagnostic.status === 'unsupported')) issues.push(`C# source binding gap changed: ${fixture.id}`);
    } else if (actual.ok) {
      if (binding.diagnostics.length || !observation) issues.push(`C# source binding rejects native-valid ${fixture.id}: ${JSON.stringify(binding.diagnostics)}`);
      else {
        match(actual.expressionType, observation.expression.type, `${fixture.id}.sourceExpressionType`);
        match(actual.convertedType, observation.converted.type, `${fixture.id}.sourceConvertedType`);
        match(actual.declaredType, observation.declaredType, `${fixture.id}.sourceDeclaredType`);
        match(actual.constantAvailable, observation.expression.constant !== undefined, `${fixture.id}.sourceConstantAvailable`);
        if (observation.expression.constant !== undefined) match(actual.constant, observation.expression.constant, `${fixture.id}.sourceConstant`);
        const nativeCalls = (actual.calls as { method: string; parameterTypes: string[] }[]).map(call => ({ method: call.method, parameterTypes: call.parameterTypes }));
        match(nativeCalls, observation.calls.map(call => ({ method: call.name, parameterTypes: call.parameterTypes })), `${fixture.id}.sourceCalls`);
      }
    } else if (!binding.diagnostics.some(diagnostic => diagnostic.status === 'invalid')) issues.push(`C# source binding misses native rejection: ${fixture.id}`);
  }
}
if (issues.length) {
  writeFileSync(join(root, 'scratch/csharp-native-observations.json'), JSON.stringify(observations, null, 2) + '\n', 'utf8');
  throw new Error(issues.join('\n'));
}
const report = {
  version: 1, scope: 'Pinned native compiler and bounded C# graph/source-mapping evidence; no completed adapter or cross-language equivalence claim',
  profile: { sdk: pins.sdk, runtime: pins.runtime, language: pins.language, roslynFileVersion: pins.roslynFileVersion, target: pins.target, nullable: pins.nullable, referenceAssemblies: Object.keys(pins.references).length },
  toolchainPins: 'packages/source-import/test/native-csharp/pins.json',
  sourceCorpus: 'packages/source-import/test/native-csharp/cases.json',
  generatedGraphCorpus: ['packages/transpiler/test/csharp-signature.fixture.json', 'packages/transpiler/test/csharpExpressionGraphs.ts', 'packages/transpiler/test/csharpLocalGraphs.ts', 'packages/transpiler/test/csharp-local.fixture.json'],
  sourceGraphMapper: 'packages/source-import/src/csharpPlan.ts',
  browserImportCorpus: 'packages/source-import/test/csharp-import-browser.fixture.json',
  summary: { booleanContractPairs: booleanCases.length, branchFlowPairs: CSHARP_BRANCH_CASES.length, mutationContractPairs: mutationCases.length, cases: observations.length, compilerAccepted: observations.filter(row => row.ok === true).length, compilerRejected: observations.filter(row => row.ok === false).length, integralContractPairs: fixtures.cases.filter(fixture => 'integralProbe' in fixture).length, sourceBindingPairs: fixtures.cases.filter(fixture => 'integralProbe' in fixture || 'sourceBinding' in fixture && fixture.sourceBinding !== 'unsupported').length, graphExpressionPairs: CSHARP_GRAPH_EXPRESSIONS.length, sourceGraphPairs: CSHARP_GRAPH_EXPRESSIONS.length, sourceBindingGaps: fixtures.cases.filter(fixture => 'sourceBinding' in fixture && fixture.sourceBinding === 'unsupported').length },
  observations,
};
const path = join(root, 'docs/design/code_visual_csharp_native_evidence.json');
const text = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--write')) writeFileSync(path, text, 'utf8');
else if (!existsSync(path) || readFileSync(path, 'utf8').replaceAll('\r\n', '\n') !== text) throw new Error('Native C# evidence report is absent or stale; regenerate through the combined native stage.');
console.log(`C# 12 / SDK ${pins.sdk}: ${report.summary.cases} native observations (${report.summary.compilerAccepted} compiler-valid, ${report.summary.compilerRejected} rejected), ${report.profile.referenceAssemblies} hash-pinned references; no fixture execution.`);
