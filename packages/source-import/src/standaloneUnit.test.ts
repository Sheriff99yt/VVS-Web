import literal from '../../syntax-packs/rosetta/full-file/literal-return.fixture.json';
import { fullFileSnapshot, type FullFileFixture } from '../test/fullFileFixture';
import { expect, test } from 'bun:test';
import { parse } from 'acorn';
import { createClassSymbol, analyzeProject, normalizeProjectSnapshot, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { transpileProject } from '@vvs/transpiler';
import { previewJavaScriptImport } from './parser';
import { reviewSourceImportGraph, acceptSourceImportReview, validateImportSnapshot } from './validation';

const syntax = (source: string) => JSON.stringify(parse(source, { ecmaVersion: 2022, sourceType: 'script' }), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
async function review(source: string, policy: 'program' | 'library' = 'library', entry = false) {
  const preview = await previewJavaScriptImport(source);
  const region = preview.regions.find(r => r.kind === 'candidate');
  return region ? reviewSourceImportGraph(preview, region, 'library.js', entry, policy) : { diagnostics: preview.regions.map(r => r.reason ?? ''), generated: '', snapshot: undefined, nodeCount: 0 };
}
for (const source of ['function identity(value) { return value; }', 'function calculate() { return (2 + 3) * 4; }', 'function choose() { if (true) { return 1; } else { return 2; } }', 'function on_start(value) { return value; }']) {
  test(`standalone full-file and persistence round trip: ${source}`, async () => {
    const result = await review(source);
    expect(result.diagnostics).toEqual([]);
    expect(syntax(result.generated)).toBe(syntax(source));
    const snapshot = result.snapshot!;
    expect(snapshot.events).toEqual([]);
    expect(snapshot.classes.every(cls => cls.isGlobalScope)).toBe(true);
    expect(Object.values(snapshot.documents).flatMap(d => d.nodes).some(n => n.data.kindId === 'class_define')).toBe(false);
    expect(snapshot.functions[0]!.binding).toBe('module');
    const definition = snapshot.documents[MAIN_GRAPH_CONTAINER_ID]!.nodes.find(n => n.data.kindId === 'function_implement')!;
    expect(transpileProject({ ...snapshot, projectEvents: [] }).sourceMap[definition.id]?.length).toBeGreaterThan(0);
    const reverse = await review(result.generated);
    expect(reverse.diagnostics).toEqual([]);
    expect(reverse.snapshot!.functions.map(fn => [fn.name, fn.binding, fn.overloads[0]!.parameters.map(p => p.label)])).toEqual(snapshot.functions.map(fn => [fn.name, fn.binding, fn.overloads[0]!.parameters.map(p => p.label)]));
    const accepted = await acceptSourceImportReview(result, source, 'library.js', false, 'library');
    const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!;
    expect(analyzeProject(loaded).ok).toBe(true);
    expect(syntax(transpileProject({ ...loaded, projectEvents: [] }).files[0]!.content)).toBe(syntax(source));
    expect(loaded.documents[MAIN_GRAPH_CONTAINER_ID]!.metadata!.compilationUnit).toEqual({ version: 1, entryPolicy: 'library' });
  });
}
test('standalone requires explicit library policy and preserves declaration diagnostics', async () => {
  const source = 'function identity(value) { return value; }';
  expect((await review(source, 'program', true)).diagnostics.join()).toContain('LIBRARY_POLICY_REQUIRED');
  expect((await review(source, 'library', true)).diagnostics.join()).toContain('LIBRARY_POLICY_REQUIRED');
  const snapshot = (await review(source)).snapshot!;
  const home = snapshot.documents[MAIN_GRAPH_CONTAINER_ID]!;
  home.nodes = home.nodes.filter(n => n.data.kindId !== 'function_define');
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'DEFINE_NODE_MISSING' && d.level === 'error')).toBe(true);
});
test('standalone mutated parameter binding and branch polarity fail fidelity gate', async () => {
  const source = 'function identity(a, b) { return a; }';
  const snapshot = (await review(source)).snapshot!;
  const body = snapshot.documents[snapshot.functions[0]!.id]!;
  body.edges.find(e => e.data?.pinType !== 'execution')!.sourceHandle = 'param-1';
  expect(() => validateImportSnapshot(snapshot, source)).toThrow('STRUCTURAL_DRIFT');
  const branchSource = 'function choose() { if (true) { return 1; } else { return 2; } }';
  const branch = (await review(branchSource)).snapshot!;
  Object.values(branch.documents).flatMap(d => d.nodes).find(n => n.data.kindId === 'flow_branch')!.data.inlineValues.condition = false;
  expect(() => validateImportSnapshot(branch, branchSource)).toThrow('STRUCTURAL_DRIFT');
});
test('original full file, Unicode ranges and excluded-source boundaries persist on visible declaration', async () => {
  const source = '// 😀 original\nfunction identity(value) { return value; }\nconst excluded = 3;';
  const result = await review(source);
  expect(result.diagnostics).toEqual([]);
  expect(result.generated).not.toContain('excluded');
  const original = Object.values(result.snapshot!.documents).flatMap(d => d.nodes).find(n => n.data.kindId === 'function_define')!.data.properties!.sourceImport as { source: string; start: number; end: number };
  expect(original.source).toBe(source);
  expect(source.slice(original.start, original.end)).toBe('function identity(value) { return value; }');
  await expect(acceptSourceImportReview(result, source, 'library.js', false, 'program')).rejects.toThrow('STALE_REVIEW');
});
for (const source of ['function f(a) { return a + 1; }', 'function f() { return captured; }', 'function f() { return f(); }', 'function f(a, a) { return a; }', 'function f() { "use strict"; return 1; }', 'async function f() { return 1; }', 'function f(a = 1) { return a; }', 'function f() { return this; }', 'function f() { return -0; }', 'function f() { return arguments; }', 'export function f() { return 1; }']) {
  test(`unsupported standalone semantics block acceptance: ${source}`, async () => {
    const result = await review(source); expect(result.snapshot).toBeUndefined(); expect(result.diagnostics.length).toBeGreaterThan(0);
  });
}

test('non-global source classes and non-module function owners retain required Class Declare', async () => {
  const snapshot = (await review('function identity(value) { return value; }')).snapshot!;
  snapshot.classes[0]!.isGlobalScope = false;
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'DEFINE_NODE_MISSING' && d.level === 'error')).toBe(true);
  snapshot.classes[0]!.isGlobalScope = true;
  snapshot.functions[0]!.binding = 'instance';
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'DEFINE_NODE_MISSING' && d.level === 'error')).toBe(true);
});

test('fixed canonical file-owned graph generates an ordinary function and reverse imports independently', async () => {
  // Fixed graph fixture is authored independently of the production importer.
  const fixed = fullFileSnapshot(literal as FullFileFixture);
  const owner = createClassSymbol('Global', { id: `global-${MAIN_GRAPH_CONTAINER_ID}`, containerId: MAIN_GRAPH_CONTAINER_ID, isGlobalScope: true });
  fixed.classes = [owner]; fixed.activeClassId = owner.id; fixed.events = [];
  for (const fn of fixed.functions) { fn.classId = owner.id; fn.binding = 'module'; }
  const home = fixed.documents[MAIN_GRAPH_CONTAINER_ID]!;
  const removed = new Set(['shell', 'entry-declaration', 'entry', 'entry-return']);
  home.nodes = home.nodes.filter(node => !removed.has(node.id));
  home.edges = home.edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target));
  home.metadata!.compilationUnit = { version: 1, entryPolicy: 'library' };
  expect(analyzeProject(fixed).ok).toBe(true);
  const source = transpileProject({ ...fixed, projectEvents: [] }).files[0]!.content;
  expect(source.trim()).toBe('function identity(value) {\n    return value;\n}');
  const imported = await review(source);
  expect(imported.diagnostics).toEqual([]);
  expect(imported.snapshot!.functions[0]!.name).toBe('identity');
  expect(imported.snapshot!.functions[0]!.overloads[0]!.parameters.map(p => p.label)).toEqual(['value']);
});
