import { expect, test } from 'bun:test';
import { parse } from 'acorn';
import { spawnSync } from 'node:child_process';
import { IMPORT_EXPANSION_CORPUS } from './expansionCorpus';
import { previewJavaScriptImport } from './parser';
import { previewPythonImport } from './python';
import { reviewSourceImportGraph, acceptSourceImportReview, validateImportSnapshot } from './validation';
import { analyzeProject, normalizeProjectSnapshot } from '@vvs/graph-types';

for (const example of IMPORT_EXPANSION_CORPUS) test(`expansion ${example.expected}: ${example.id}`, async () => {
  const preview = await (example.language === 'python' ? previewPythonImport : previewJavaScriptImport)(example.source);
  const region = preview.regions.find(region => region.kind === 'candidate');
  const fileName = `example.${example.language === 'python' ? 'py' : 'js'}`;
  const review = region && reviewSourceImportGraph(preview, region, fileName, false, 'library');
  if (example.expected === 'gap') {
    expect(review?.snapshot).toBeUndefined();
    expect(Boolean(preview.diagnostics.length || preview.regions.some(region => region.reason) || review?.diagnostics.length)).toBe(true);
    return;
  }
  expect(review?.diagnostics, example.id).toEqual([]);
  expect(review?.snapshot).toBeDefined();
  const accepted = await acceptSourceImportReview(review!, example.source, fileName, false, 'library');
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!;
  expect(analyzeProject(loaded).ok).toBe(true);
  expect(validateImportSnapshot(loaded, example.source).generated).toBe(review!.generated);
  if (example.language === 'javascript') {
    const facts = (source: string) => JSON.stringify(parse(source, { ecmaVersion: 2022, sourceType: 'module' }), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
    expect(facts(review!.generated)).toBe(facts(example.source));
  } else {
    const result = spawnSync('python', ['-c', 'import ast,json,sys; a,b=json.load(sys.stdin); assert sys.version_info[:2]==(3,11); compile(ast.parse(a),"a.py","exec"); compile(ast.parse(b),"b.py","exec"); assert ast.dump(ast.parse(a))==ast.dump(ast.parse(b))'], { input: JSON.stringify([example.source, review!.generated]), encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  }
});

test('locals stay body-owned, duplicate names resolve by symbol ID, and missing declarations block Generate', async () => {
  const source = 'function first() { const x = 1; return x; } function second() { const x = "two"; return x; }';
  const preview = await previewJavaScriptImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'locals.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const snapshot = structuredClone(review.snapshot!);
  expect(snapshot.variables).toHaveLength(2);
  expect(snapshot.variables[0].graphTabId).not.toBe(snapshot.variables[1].graphTabId);
  const wrongScope = structuredClone(snapshot);
  const get = wrongScope.documents[wrongScope.variables[0].graphTabId!].nodes.find(node => node.data.kindId === 'variable_get')!;
  get.data.graphBinding = { kind: 'variable_ref', symbolId: wrongScope.variables[1].id };
  get.data.properties!.symbolId = wrongScope.variables[1].id;
  expect(analyzeProject(wrongScope).diagnostics.some(diagnostic => diagnostic.code === 'LOCAL_SCOPE_MISMATCH')).toBe(true);
  const variable = snapshot.variables[1];
  snapshot.documents[variable.graphTabId!].nodes = snapshot.documents[variable.graphTabId!].nodes.filter(node => node.data.kindId !== 'var_define');
  expect(analyzeProject(snapshot).diagnostics.some(diagnostic => diagnostic.code === 'DEFINE_NODE_MISSING' && diagnostic.symbolId === variable.id)).toBe(true);
});

test('persisted Number conversion cannot silently change to parseFloat', async () => {
  const source = 'function number(value) { return Number(value); }';
  const preview = await previewJavaScriptImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'number.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const snapshot = structuredClone(review.snapshot!);
  const node = Object.values(snapshot.documents).flatMap(document => document.nodes).find(node => node.data.kindId === 'convert_to_number')!;
  expect(node.data.properties!.numberMode).toBe('number');
  node.data.properties!.numberMode = 'parseFloat';
  expect(() => validateImportSnapshot(snapshot, source)).toThrow('STRUCTURAL_DRIFT');
});

test('counted header ownership, loop-local escape and unsupported target mutations block Generate', async () => {
  const example = IMPORT_EXPANSION_CORPUS.find(example => example.id === 'js-for-count')!;
  const preview = await previewJavaScriptImport(example.source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sum.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const snapshot = structuredClone(review.snapshot!);
  const tabId = Object.keys(snapshot.documents).find(tabId => snapshot.documents[tabId].nodes.some(node => node.data.kindId === 'flow_for'))!;
  const doc = snapshot.documents[tabId], loop = doc.nodes.find(node => node.data.kindId === 'flow_for')!;
  const comparison = doc.nodes.find(node => node.data.kindId === 'expr_compare')!;
  expect(comparison.data.inputs.every(pin => pin.type === 'data_any')).toBe(true); // Inspector mode changes must not leave stale typed inputs.
  const invalidComparison = structuredClone(snapshot);
  invalidComparison.documents[tabId].nodes.find(node => node.id === comparison.id)!.data.properties!.operator = '===';
  expect(analyzeProject(invalidComparison).diagnostics.some(diagnostic => diagnostic.code === 'COMPARISON_VARIANT_INVALID')).toBe(true);
  const missingHeader = structuredClone(snapshot);
  missingHeader.documents[tabId].edges = missingHeader.documents[tabId].edges.filter(edge => edge.sourceHandle !== 'update_exec');
  expect(analyzeProject(missingHeader).diagnostics.some(diagnostic => diagnostic.code === 'FOR_HEADER_INVALID')).toBe(true);
  const escape = structuredClone(snapshot), escapedDoc = escape.documents[tabId];
  const get = escapedDoc.nodes.find(node => node.data.kindId === 'variable_get' && node.data.properties?.variableName === 'index')!;
  const ret = escapedDoc.nodes.find(node => node.data.kindId === 'flow_return')!;
  const pin = ret.data.inputs.find(pin => pin.type !== 'execution')!.id;
  escapedDoc.edges = escapedDoc.edges.filter(edge => !(edge.target === ret.id && edge.targetHandle === pin));
  escapedDoc.edges.push({ id: 'escape', source: get.id, sourceHandle: 'val', target: ret.id, targetHandle: pin, type: 'vvs_standard_edge', data: { pinType: 'data_number' } });
  expect(analyzeProject(escape).diagnostics.some(diagnostic => diagnostic.code === 'LOCAL_SCOPE_ESCAPE')).toBe(true);
  escapedDoc.edges.find(edge => edge.id === 'escape')!.source = loop.id;
  escapedDoc.edges.find(edge => edge.id === 'escape')!.sourceHandle = 'index';
  expect(analyzeProject(escape).diagnostics.some(diagnostic => diagnostic.code === 'LOCAL_SCOPE_ESCAPE')).toBe(true);
  const target = structuredClone(snapshot); target.targetLanguage = 'python';
  expect(analyzeProject(target).diagnostics.some(diagnostic => diagnostic.code === 'FOR_HEADER_TARGET_UNSUPPORTED')).toBe(true);
  expect(doc.edges.filter(edge => edge.source === loop.id && edge.sourceHandle === 'exec_out')).toHaveLength(1);
});

test('program-entry locals on the class graph never become class fields', async () => {
  const source = 'class Counter { on_start() { let total = 0; for (let index = 0; index < 3; index++) { total += index; } return total; } }';
  const preview = await previewJavaScriptImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'counter.js', true, 'program');
  expect(review.diagnostics).toEqual([]);
  expect(review.generated.match(/let total/g)).toHaveLength(1);
  expect(review.generated.match(/let index/g)).toHaveLength(1);
  expect(review.generated).not.toContain('    total = 0;');
  expect(review.generated).not.toContain('    index = 0;');
  const accepted = await acceptSourceImportReview(review, source, 'counter.js', true, 'program');
  expect(analyzeProject(normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!).ok).toBe(true);
});
