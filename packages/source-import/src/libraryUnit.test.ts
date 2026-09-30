import { expect, test } from 'bun:test';
import { analyzeProject, MAIN_GRAPH_CONTAINER_ID, normalizeProjectSnapshot, type TargetLanguage } from '@vvs/graph-types';
import { transpileProject } from '@vvs/transpiler';
import { parse } from 'acorn';
import literal from '../../syntax-packs/rosetta/full-file/literal-return.fixture.json';
import { fullFileSnapshot, type FullFileFixture } from '../test/fullFileFixture';
import { previewJavaScriptImport } from './parser';
import { acceptSourceImportReview, reviewSourceImportGraph } from './validation';
import { semanticProjection } from '../test/semanticProjection';

function library() {
  const snapshot = fullFileSnapshot(literal as FullFileFixture);
  snapshot.events = [];
  const home = snapshot.documents[MAIN_GRAPH_CONTAINER_ID]!;
  const removed = new Set(['entry-declaration', 'entry', 'entry-return']);
  home.nodes = home.nodes.filter(node => !removed.has(node.id));
  home.edges = home.edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target));
  home.edges.push({ id: 'library-members', source: 'shell', target: 'fn-declaration', sourceHandle: 'exec_out', targetHandle: 'exec_in', type: 'vvs_standard_edge', data: { pinType: 'execution' } });
  home.metadata!.compilationUnit = { version: 1, entryPolicy: 'library' };
  return snapshot;
}

const independentSyntax = (source: string) => JSON.stringify(parse(source, { ecmaVersion: 2022, sourceType: 'script' }), (key, value) =>
  ['start', 'end', 'raw'].includes(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
test('library class round trips in both directions with independent syntax, role facts and sealed persistence', async () => {
  const source = 'class Literal { identity(value) { return value; } }';
  const preview = await previewJavaScriptImport(source);
  const region = preview.regions.find(region => region.kind === 'candidate')!;
  const review = reviewSourceImportGraph(preview, region, 'library.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  expect(review.snapshot!.events).toEqual([]);
  expect(independentSyntax(review.generated)).toBe(independentSyntax(source));
  const expected = { className: 'Literal', methods: [['identity', false, 'method', ['value'], ['return', ['parameter', 'value']]]] };
  expect(semanticProjection(review.snapshot!)).toEqual(expected);
  const fixed = library();
  const generated = transpileProject({ ...fixed, projectEvents: [] }).files[0]!.content;
  expect(independentSyntax(generated)).toBe(independentSyntax(source));
  const generatedPreview = await previewJavaScriptImport(generated);
  const reverse = reviewSourceImportGraph(generatedPreview, generatedPreview.regions.find(region => region.kind === 'candidate')!, 'library.js', false, 'library');
  expect(semanticProjection(reverse.snapshot!)).toEqual(expected);
  const accepted = await acceptSourceImportReview(review, source, 'library.js', false, 'library');
  expect(analyzeProject(normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!).ok).toBe(true);
  await expect(acceptSourceImportReview(review, source, 'library.js', false, 'program')).rejects.toThrow('STALE_REVIEW');
  review.snapshot!.documents[MAIN_GRAPH_CONTAINER_ID]!.metadata!.compilationUnit!.entryPolicy = 'program';
  await expect(acceptSourceImportReview(review, source, 'library.js', false, 'library')).rejects.toThrow('STALE_REVIEW');
});
test('library methods named on_start remain ordinary, and conflicting entry consent is rejected', async () => {
  const preview = await previewJavaScriptImport('class Library { on_start() { return 1; } }');
  const region = preview.regions.find(region => region.kind === 'candidate')!;
  const review = reviewSourceImportGraph(preview, region, 'library.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  expect(review.snapshot!.events).toHaveLength(0);
  expect(review.snapshot!.functions[0]!.name).toBe('on_start');
  expect(reviewSourceImportGraph(preview, region, 'library.js', true, 'library').diagnostics.join()).toContain('ENTRY_POLICY_CONFLICT');
});

test('explicit library policy permits ordinary declarations while legacy/program entry remains blocking', () => {
  const snapshot = library();
  expect(analyzeProject(snapshot).ok).toBe(true);
  const home = snapshot.documents[MAIN_GRAPH_CONTAINER_ID]!;
  delete home.metadata!.compilationUnit;
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'PROGRAM_ENTRY_MISSING' && d.level === 'error')).toBe(true);
  home.metadata!.compilationUnit = { version: 1, entryPolicy: 'program' };
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'PROGRAM_ENTRY_MISSING')).toBe(true);
  home.metadata!.compilationUnit = { version: 2, entryPolicy: 'library' } as unknown as NonNullable<typeof home.metadata>['compilationUnit'];
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'COMPILATION_UNIT_POLICY_INVALID' && d.level === 'error')).toBe(true);
});
test('library policy does not weaken canvas declaration fidelity', () => {
  const snapshot = library();
  snapshot.documents[MAIN_GRAPH_CONTAINER_ID]!.nodes = snapshot.documents[MAIN_GRAPH_CONTAINER_ID]!.nodes.filter(node => node.id !== 'shell');
  expect(analyzeProject(snapshot).diagnostics.some(d => d.code === 'DEFINE_NODE_MISSING' && d.level === 'error')).toBe(true);
  const existingEntry = fullFileSnapshot(literal as FullFileFixture);
  const home = existingEntry.documents[MAIN_GRAPH_CONTAINER_ID]!;
  home.metadata!.compilationUnit = { version: 1, entryPolicy: 'library' };
  home.nodes = home.nodes.filter(node => node.id !== 'entry-declaration');
  expect(analyzeProject(existingEntry).diagnostics.some(d => d.code === 'PROGRAM_ENTRY_NOT_ON_CANVAS' && d.level === 'error')).toBe(true);
});
for (const language of ['python', 'javascript', 'cpp', 'verse', 'gdscript', 'rust', 'csharp', 'go'] as TargetLanguage[]) {
  test(`library policy preserves ${language} full-file generation and persistence without invented entry`, () => {
    const snapshot = library(); snapshot.targetLanguage = language;
    for (const doc of Object.values(snapshot.documents)) doc.metadata!.targetLanguage = language;
    expect(analyzeProject(snapshot).ok).toBe(true);
    const generated = transpileProject({ ...snapshot, projectEvents: snapshot.events });
    expect(generated.files).toHaveLength(1);
    expect(generated.files[0]!.content).not.toContain('on_start');
    expect(generated.sourceMap['fn-define']?.length).toBeGreaterThan(0);
    const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!;
    expect(loaded.documents[MAIN_GRAPH_CONTAINER_ID]!.metadata!.compilationUnit).toEqual({ version: 1, entryPolicy: 'library' });
    expect(analyzeProject(loaded).ok).toBe(true);
    expect(transpileProject({ ...loaded, projectEvents: loaded.events }).files).toEqual(generated.files);
    if (language === 'javascript') expect(() => parse(generated.files[0]!.content, { ecmaVersion: 2022, sourceType: 'script' })).not.toThrow();
  });
}
