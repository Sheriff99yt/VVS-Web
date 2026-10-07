import { expect, test } from 'bun:test';
import { previewPythonImport, normalizedPythonSyntax } from './python';
import { reviewSourceImportGraph, acceptSourceImportReview, validateImportSnapshot } from './validation';
import { normalizeProjectSnapshot, analyzeProject, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { spawnSync } from 'node:child_process';

export const PYTHON_PILOT_FIXTURES = [
  'def defaulted(value=1):\n    return value\n',
  'def variadic(*values):\n    return values\n',
  'def identity(value):\n    return value\n',
  'def greeting():\n    return "hello"\n',
  'def calculate():\n    return (2 + 3) * 4\n',
  'def choose(a, b):\n    if True:\n        return a\n    else:\n        return b\n',
];
for (const source of PYTHON_PILOT_FIXTURES) test(`Python full-file round trip: ${source.split('\n')[0]}`, async () => {
  const preview = await previewPythonImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'pilot.py', false, 'library');
  expect(review.diagnostics).toEqual([]);
  expect(review.generated).not.toContain('self');
  expect(review.generated).not.toContain('class Global');
  expect(normalizedPythonSyntax(review.generated)).toBe(normalizedPythonSyntax(source));
  const snapshot = await acceptSourceImportReview(review, source, 'pilot.py', false, 'library');
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!;
  expect(validateImportSnapshot(loaded, source).generated).toBe(review.generated);
  expect(loaded.events).toEqual([]);
  expect(loaded.documents[MAIN_GRAPH_CONTAINER_ID].metadata?.compilationUnit?.entryPolicy).toBe('library');
});

test('Python rejects captures, parser recovery and unsupported callable context', async () => {
  for (const source of [
    'def f():\n    return external\n',
    'def f(a=external):\n    return a\n', 'async def f():\n    return 1\n',
    'def f():\n    return (\n',
  ]) {
    const preview = await previewPythonImport(source);
    const region = preview.regions.find(region => region.kind === 'candidate');
    const review = region && reviewSourceImportGraph(preview, region, 'pilot.py', false, 'library');
    expect(review?.snapshot).toBeUndefined();
    expect(preview.diagnostics.length || review?.diagnostics.length).toBeTruthy();
  }
});

test('independent CPython 3.11 parses and compiles source and actual generated files without executing them', async () => {
  const pairs = [];
  for (const source of PYTHON_PILOT_FIXTURES) {
    const preview = await previewPythonImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'pilot.py', false, 'library');
    pairs.push([source, review.generated]);
  }
  const input = JSON.stringify(pairs);
  const result = spawnSync('python', ['-c', 'import ast,json,sys; assert sys.version_info[:2] == (3,11); pairs=json.load(sys.stdin); [compile(ast.parse(s), "fixture.py", "exec") for pair in pairs for s in pair]; assert all(ast.dump(ast.parse(a)) == ast.dump(ast.parse(b)) for a,b in pairs)'], { input, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});

test('Python branch intersection initializes a function local only on every path', async () => {
  const source = 'def choose(flag):\n    if flag == True:\n        result = 1\n    else:\n        result = 2\n    return result\n';
  const preview = await previewPythonImport(source);
  const result = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'branch.py', false, 'library');
  expect(result.diagnostics).toEqual([]);
  expect(normalizedPythonSyntax(result.generated)).toBe(normalizedPythonSyntax(source));
  expect(validateImportSnapshot(normalizeProjectSnapshot(JSON.parse(JSON.stringify(result.snapshot)))!, source).generated).toBe(result.generated);
  for (const invalid of ['def choose(flag):\n    if flag == True:\n        result = 1\n    return result\n', 'def choose():\n    result = result + 1\n    return result\n']) {
    const bad = await previewPythonImport(invalid);
    const region = bad.regions.find(region => region.kind === 'candidate');
    if (region) expect(reviewSourceImportGraph(bad, region, 'branch.py', false, 'library').snapshot).toBeUndefined();
    else expect(bad.regions.some(region => region.reason)).toBe(true);
  }
});

for (const source of [
  'def choose(first, second=2):\n    return [first, second]\ndef use():\n    return choose(second=3, first=1)\n',
  'def defaults(value=[1, 2]):\n    return value\ndef use():\n    return defaults()\n',
  'def collect(*values):\n    return values\ndef use():\n    return collect(1, 2, 3)\n',
  'def collect(*values):\n    return values\ndef use():\n    return collect()\n',
]) test(`Python native signatures and supplied arguments: ${source.split('\n')[0]}`, async () => {
  const preview = await previewPythonImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'signature.py', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const facts = (text: string) => spawnSync('python', ['-X', 'utf8', '-c', 'import ast,sys; print(ast.dump(ast.parse(sys.stdin.read()), include_attributes=False))'], { input: text, encoding: 'utf8' });
  const expected = facts(source), actual = facts(review.generated);
  expect(expected.status).toBe(0); expect(actual.status).toBe(0); expect(actual.stdout).toBe(expected.stdout);
  expect(validateImportSnapshot(normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!, source).generated).toBe(review.generated);
});

test('Python named argument binding failures block acceptance', async () => {
  for (const call of ['choose(first=1, first=2)', 'choose(1, first=2)', 'choose(unknown=1)', 'choose(second=2)', 'choose(first=1, 2)', 'choose(*[1])']) {
    const source = `def choose(first, second=2):\n    return [first, second]\ndef use():\n    return ${call}\n`;
    const preview = await previewPythonImport(source);
    const region = preview.regions.find(region => region.kind === 'candidate');
    if (region) expect(reviewSourceImportGraph(preview, region, 'invalid.py', false, 'library').snapshot).toBeUndefined();
    else expect(preview.diagnostics.length).toBeGreaterThan(0);
  }
});

test('Python visible default and named-argument graph corruption produces diagnostics', async () => {
  const source = 'def choose(first, second=[2]):\n    return [first, second]\ndef use():\n    return choose(second=[3], first=1)\n';
  const preview = await previewPythonImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'mutations.py', false, 'library');
  expect(review.diagnostics).toEqual([]);
  for (const mutation of ['default', 'names', 'signature', 'count', 'value']) {
    const snapshot = structuredClone(review.snapshot!);
    const nodes = Object.values(snapshot.documents).flatMap(doc => doc.nodes);
    const definition = nodes.find(node => node.data.kindId === 'function_implement' && (node.data.properties?.nativeParameters as { defaultPin?: string }[])?.some(parameter => parameter.defaultPin))!;
    const call = nodes.find(node => node.data.properties?.nativeArgumentNames)!;
    if (mutation === 'default') definition.data.inputs = definition.data.inputs.filter(pin => !pin.id.startsWith('default-'));
    if (mutation === 'names') call.data.properties!.nativeArgumentNames = ['first', 'first'];
    if (mutation === 'signature') definition.data.properties!.nativeParameters = [null];
    if (mutation === 'count') call.data.properties!.nativeArgumentCount = '2';
    if (mutation === 'value') { const doc = Object.values(snapshot.documents).find(doc => doc.nodes.includes(call))!; doc.edges = doc.edges.filter(edge => edge.target !== call.id || edge.targetHandle !== 'arg-0'); delete call.data.inlineValues?.['arg-0']; }
    expect(analyzeProject(snapshot).ok).toBe(false);
  }
});
