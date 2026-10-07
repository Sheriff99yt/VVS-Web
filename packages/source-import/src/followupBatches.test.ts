import { expect, test } from 'bun:test';
import { parse } from 'acorn';
import { analyzeProject } from '@vvs/graph-types';
import { previewJavaScriptImport } from './parser';
import { previewPythonImport } from './python';
import { reviewSourceFileSet, acceptSourceFileSetReview, reviewSourceImportGraph, reviewSourceReimport, acceptSourceReimport } from './validation';

test('closed module set preserves aliases, exports, paths, calls and persistence', async () => {
  const files = [
    { fileName: 'main.js', source: 'import { identity as copy } from "./math.js"; export function pipeline(value) { const result = copy(value); return copy(result); }' },
    { fileName: 'math.js', source: 'export function identity(value) { return value; }' },
  ];
  const review = await reviewSourceFileSet(files);
  expect(review.diagnostics).toEqual([]);
  expect(review.files.map(file => file.fileName).sort()).toEqual(['main.js', 'math.js']);
  const snapshot = acceptSourceFileSetReview(review, files);
  expect(analyzeProject(snapshot).ok).toBe(true);
  expect(snapshot.classes).toHaveLength(2);
  expect(new Set(Object.values(snapshot.documents).flatMap(doc => doc.nodes).map(node => node.id)).size).toBe(review.nodeCount);
  const facts = (source: string) => JSON.stringify(parse(source, { ecmaVersion: 2022, sourceType: 'module' }), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
  for (const file of files) expect(facts(review.files.find(output => output.fileName === file.fileName)!.generated)).toBe(facts(file.source));
  expect(() => acceptSourceFileSetReview(review, files.map(file => ({ ...file, source: file.source + '\n' })))).toThrow('STALE_REVIEW');
});

test('module dependency, nonexported binding, signature and path failures block the whole set', async () => {
  for (const files of [
    [{ fileName: 'main.js', source: 'import { missing } from "./missing.js"; export function f() { return missing(); }' }],
    [{ fileName: '../main.js', source: 'export function f() { return 0; }' }],
    [{ fileName: 'main.js', source: 'export function f() { return 0; }' }, { fileName: 'MAIN.js', source: 'export function g() { return 0; }' }],
    [{ fileName: 'main.js', source: 'import { f } from "./math.js"; export function g() { return f(); }' }, { fileName: 'math.js', source: 'export function f(value) { return value; }' }],
  ]) {
    const review = await reviewSourceFileSet(files);
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0);
  }
});

test('loop target, repeated effects, lexical dominance and integer target edits are blocking', async () => {
  const source = 'function identity(value) { return value; } function scan(value) { while (identity(value) === true) { if (value === false) { break; } identity(value); } return value; }';
  const preview = await previewJavaScriptImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'scan.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const target = structuredClone(review.snapshot!);
  const control = Object.values(target.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'flow_break')!;
  control.data.properties!.loopTargetId = 'wrong-loop';
  expect(analyzeProject(target).diagnostics.some(diagnostic => diagnostic.code === 'LOOP_TARGET_INVALID')).toBe(true);
  const effects = structuredClone(review.snapshot!);
  const doc = Object.values(effects.documents).find(doc => doc.edges.some(edge => edge.sourceHandle === 'condition_exec'))!;
  doc.edges = doc.edges.filter(edge => edge.sourceHandle !== 'condition_exec');
  expect(analyzeProject(effects).diagnostics.some(diagnostic => diagnostic.code === 'LOOP_CONDITION_EFFECT')).toBe(true);
});

test('three-way re-import keeps graph-only edits and blocks simultaneous edits until resolved', async () => {
  const source = 'function value() { return 1; }';
  const preview = await previewJavaScriptImport(source);
  const imported = reviewSourceImportGraph(preview, preview.regions[0], 'value.js', false, 'library');
  expect(imported.diagnostics).toEqual([]);
  const current = structuredClone(imported.snapshot!);
  const ret = Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'flow_return')!;
  ret.data.inlineValues[ret.data.inputs.find(pin => pin.type !== 'execution')!.id] = 2;
  const graphOnly = await reviewSourceReimport(current, source, 'value.js');
  expect(graphOnly.diagnostics).toEqual([]); expect(graphOnly.conflicts).toEqual([]);
  expect(acceptSourceReimport(graphOnly, current, source)).toEqual(current);
  const replacement = 'function value() { return 3; }';
  const conflict = await reviewSourceReimport(current, replacement, 'value.js');
  expect(conflict.diagnostics).toEqual([]); expect(conflict.conflicts).toHaveLength(1);
  expect(() => acceptSourceReimport(conflict, current, replacement)).toThrow('REIMPORT_CONFLICT');
  expect(acceptSourceReimport(conflict, current, replacement, 'keep-graph')).toEqual(current);
  const accepted = acceptSourceReimport(conflict, current, replacement, 'use-source');
  expect(analyzeProject(accepted).ok).toBe(true);
  const stale = structuredClone(current); stale.variables.push({ kind: 'variable', id: 'extra', name: 'extra', type: 'data_number', binding: 'instance', visibility: 'public' });
  expect(() => acceptSourceReimport(conflict, stale, replacement, 'use-source')).toThrow('STALE_REIMPORT');
  conflict.conflicts.length = 0;
  expect(() => acceptSourceReimport(conflict, current, replacement, 'use-source')).toThrow('STALE_REIMPORT');
});


test('module sets retain parameter bindings in ordinary unexported files', async () => {
  const files = [{ fileName: 'identity.js', source: 'function identity(value) { return value; }' }];
  const review = await reviewSourceFileSet(files);
  expect(review.diagnostics).toEqual([]);
  expect(analyzeProject(acceptSourceFileSetReview(review, files)).ok).toBe(true);
});

test('comment-only edits participate in three-way re-import conflict review', async () => {
  const source = 'function value() { /* original */ return 1; }';
  const preview = await previewJavaScriptImport(source);
  const imported = reviewSourceImportGraph(preview, preview.regions[0], 'value.js', false, 'library');
  expect(imported.diagnostics).toEqual([]);
  const current = structuredClone(imported.snapshot!);
  const comment = Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.type === 'vvs_comment_node')!;
  comment.data.properties!.commentText = 'graph edit';
  const unchanged = await reviewSourceReimport(current, source, 'value.js');
  expect(unchanged.diagnostics).toEqual([]);
  expect(acceptSourceReimport(unchanged, current, source)).toEqual(current);
  const incoming = source.replace('original', 'source edit');
  const conflict = await reviewSourceReimport(current, incoming, 'value.js');
  expect(conflict.diagnostics).toEqual([]);
  expect(conflict.conflicts).toHaveLength(1);
});


test('native integer locals and range arguments reject incompatible graph edits', async () => {
  const source = 'def sum():\n    total = 0\n    for index in range(4):\n        total = total + index\n    return total\n';
  const preview = await previewPythonImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sum.py', false, 'library');
  expect(review.diagnostics).toEqual([]);
  for (const [kind, pin, code] of [['var_define', 'value', 'INTEGER_DOMAIN_INITIALIZER'], ['flow_for', 'first', 'RANGE_INTEGER_ARGUMENT'], ['variable_set', 'val', 'INTEGER_DOMAIN_ASSIGNMENT']]) {
    const edited = structuredClone(review.snapshot!);
    const doc = Object.values(edited.documents).find(doc => doc.nodes.some(node => node.data.kindId === kind && (kind !== 'var_define' || node.data.properties?.declarationKind !== 'loop-index')))!;
    const node = doc.nodes.find(node => node.data.kindId === kind && (kind !== 'var_define' || node.data.properties?.declarationKind !== 'loop-index'))!;
    doc.edges = doc.edges.filter(edge => !(edge.target === node.id && edge.targetHandle === pin));
    node.data.inlineValues[pin] = 1.5;
    expect(analyzeProject(edited).diagnostics.some(diagnostic => diagnostic.code === code)).toBe(true);
  }
});
