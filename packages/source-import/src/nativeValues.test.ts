import { expect, test } from 'bun:test';
import { parse } from 'acorn';
import { spawnSync } from 'node:child_process';
import { analyzeProject, normalizeProjectSnapshot } from '@vvs/graph-types';
import { inventoryNativeValues, type NativeScalar } from './nativeValues';
import { NATIVE_VALUE_CORPUS } from './nativeValueCorpus';
import { previewJavaScriptImport } from './parser';
import { previewPythonImport } from './python';
import { reviewSourceImportGraph, acceptSourceImportReview, validateImportSnapshot, reviewSourceReimport, acceptSourceReimport } from './validation';

function decodeFloat(scalar: NativeScalar) {
  if (scalar.encoding !== 'ieee754-binary64-be') throw new Error('Expected binary64');
  const bytes = Uint8Array.from(scalar.payload.match(/../g)!, pair => parseInt(pair, 16));
  return new DataView(bytes.buffer).getFloat64(0, false);
}

test('exact native numbers survive JSON without erasing negative zero, overflow or integer precision', () => {
  const js = inventoryNativeValues(NATIVE_VALUE_CORPUS[0].source, 'javascript.es2022');
  const py = inventoryNativeValues(NATIVE_VALUE_CORPUS[1].source, 'python.3.11');
  const persisted = JSON.parse(JSON.stringify([js, py]));
  expect(persisted).toEqual([js, py]);
  for (const inventory of persisted) {
    const scalars: NativeScalar[] = inventory.facts.filter((fact: { scalar?: NativeScalar }) => fact.scalar).map((fact: { scalar: NativeScalar }) => fact.scalar);
    expect(Object.is(decodeFloat(scalars[0]), -0)).toBe(true);
    expect(scalars[1].payload).toBe('9007199254740993');
    expect(decodeFloat(scalars[2])).toBe(Infinity);
    expect(scalars[3].payload).toBeNull();
    expect(scalars[4].payload).toBe(true);
  }
  expect(js.facts.find(fact => fact.scalar?.encoding === 'decimal-integer')!.scalar!.domain).toBe('javascript-bigint');
  expect(py.facts.find(fact => fact.scalar?.encoding === 'decimal-integer')!.scalar!.domain).toBe('python-integer');
});

test('independent Acorn and CPython ASTs validate trusted numeric fixtures without execution', () => {
  const js = NATIVE_VALUE_CORPUS[0].source;
  const ast = parse(js, { ecmaVersion: 2022 }) as unknown as { body: { body: { body: { argument: { elements: { type: string; value?: unknown; argument?: { value: number } }[] } }[] } }[] };
  const values = ast.body[0].body.body[0].argument.elements;
  expect(Object.is(-values[0].argument!.value, -0)).toBe(true);
  expect(String(values[1].value)).toBe('9007199254740993');
  expect(values[2].value).toBe(Infinity);
  const validation = spawnSync('python', ['-X', 'utf8', '-c', 'import ast,json,sys,struct; assert sys.version_info[:2]==(3,11); tree=ast.parse(json.load(sys.stdin)); compile(tree,"fixture.py","exec"); xs=tree.body[0].body[0].value.elts; assert struct.pack(">d",-xs[0].operand.value).hex()=="8000000000000000"; assert xs[1].value==9007199254740993; assert xs[2].value==float("inf"); assert xs[3].value is None; assert xs[4].value is True'], { input: JSON.stringify(NATIVE_VALUE_CORPUS[1].source), encoding: 'utf8' });
  expect(validation.status, validation.stderr).toBe(0);
});

test('native token domains distinguish radix integers, float exponents and source strings', () => {
  for (const [profile, source] of [
    ['javascript.es2022', 'function values() { return [-0x0, -0xffn, 0b1_010n, "\\u00e9"]; }'],
    ['python.3.11', 'def values():\n    return [-0x0, -0xff, 0b1_010, "\\u00e9"]\n'],
  ] as const) {
    const scalars = inventoryNativeValues(source, profile).facts.flatMap(fact => fact.scalar ? [fact.scalar] : []);
    expect(scalars[1].payload).toBe('-255'); expect(scalars[2].payload).toBe('10');
    expect(scalars[3].encoding).toBe(profile === 'javascript.es2022' ? 'decoded-string' : 'source-token');
  }
});

for (const example of NATIVE_VALUE_CORPUS) test(`${example.id} inventories complete spans and has a certified visual mapping`, async () => {
  if (example.profile === 'javascript.es2022') expect(() => parse(example.source, { ecmaVersion: 2022, sourceType: 'module' })).not.toThrow();
  else {
    const parsed = spawnSync('python', ['-X', 'utf8', '-c', 'import ast,json,sys; assert sys.version_info[:2]==(3,11); compile(ast.parse(json.load(sys.stdin)),"fixture.py","exec")'], { input: JSON.stringify(example.source), encoding: 'utf8' });
    expect(parsed.status, parsed.stderr).toBe(0);
  }
  const inventory = inventoryNativeValues(example.source, example.profile);
  expect(inventory.acceptance).toBe('inventory-only');
  expect(inventory.facts.length).toBeGreaterThan(0);
  for (const fact of inventory.facts) {
    expect(fact.syntax).toBe(example.source.slice(fact.start, fact.end));
    expect(fact.mapping).toBe('not-certified');
    expect(fact.operands.every(operand => operand.start >= fact.start && operand.end <= fact.end)).toBe(true);
  }
  const preview = await (example.profile === 'python.3.11' ? previewPythonImport : previewJavaScriptImport)(example.source);
  const region = preview.regions.find(region => region.kind === 'candidate');
  const complete = !preview.regions.some(region => region.kind === 'unresolved');
  const review = complete && region ? reviewSourceImportGraph(preview, region, 'values.js', false, 'library') : undefined;
  expect(review?.diagnostics, example.id).toEqual([]);
  expect(review?.snapshot, example.id).toBeDefined();
  const fileName = 'values.js';
  const accepted = await acceptSourceImportReview(review!, example.source, fileName, false, 'library');
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!;
  expect(analyzeProject(loaded).ok).toBe(true);
  const generated = validateImportSnapshot(loaded, example.source).generated;
  if (example.profile === 'javascript.es2022') {
    const facts = (source: string) => JSON.stringify(parse(source, { ecmaVersion: 2022, sourceType: 'module' }), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : typeof value === 'bigint' ? String(value) : value);
    expect(facts(generated)).toBe(facts(example.source));
  } else {
    const parsed = spawnSync('python', ['-X', 'utf8', '-c', 'import ast,json,sys; a,b=json.load(sys.stdin); compile(ast.parse(a),"a.py","exec"); compile(ast.parse(b),"b.py","exec"); assert ast.dump(ast.parse(a))==ast.dump(ast.parse(b))'], { input: JSON.stringify([example.source, generated]), encoding: 'utf8' });
    expect(parsed.status, parsed.stderr).toBe(0);
  }

});

test('Unicode and CRLF keep exact source-token boundaries and collection/access ownership', () => {
  for (const [profile, source] of [
    ['javascript.es2022', 'function value() { const label = "é😀"; return [label, -0][0]; }'],
    ['python.3.11', 'def value():\r\n    label = "é😀"\r\n    return [label, -0.0][0]\r\n'],
  ] as const) {
    const inventory = inventoryNativeValues(source, profile);
    expect(inventory.facts.some(fact => fact.kind === 'access')).toBe(true);
    expect(inventory.facts.find(fact => fact.scalar?.domain === 'string')!.syntax).toBe('"é😀"');
    const zero = inventory.facts.find(fact => fact.scalar?.encoding === 'ieee754-binary64-be' && fact.scalar.payload === '8000000000000000')!;
    expect(source.slice(zero.start, zero.end)).toBe(profile === 'javascript.es2022' ? '-0' : '-0.0');
    expect(JSON.parse(JSON.stringify(inventory))).toEqual(inventory);
  }
});

test('recovery, oversized sources and unimplemented profile claims fail closed', () => {
  expect(() => inventoryNativeValues('def values():\n    return [1,,2]\n', 'python.3.11')).toThrow('NATIVE_VALUE_PARSE');
  expect(() => inventoryNativeValues('function values( {', 'javascript.es2022')).toThrow();
  expect(() => inventoryNativeValues('x'.repeat(128 * 1024 + 1), 'python.3.11')).toThrow('SOURCE_BUDGET');
  expect(() => inventoryNativeValues('', 'go.1.26' as 'python.3.11')).toThrow('NATIVE_VALUE_PROFILE');
});

test('native graph edits block incompatible targets, malformed values, missing ports, cycles and effect movement', async () => {
  const example = NATIVE_VALUE_CORPUS[2];
  const preview = await previewJavaScriptImport(example.source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'values.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  for (const mode of ['target', 'arity', 'missing', 'container', 'cycle', 'effects', 'reorder']) {
    const snapshot = structuredClone(review.snapshot!);
    const doc = Object.values(snapshot.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'expr_native_collection'))!;
    const collection = doc.nodes.find(node => node.data.kindId === 'expr_native_collection')!;
    if (mode === 'target') snapshot.targetLanguage = 'rust';
    if (mode === 'arity') collection.data.properties!.operandCount = 33;
    if (mode === 'missing') doc.edges = doc.edges.filter(edge => edge.target !== collection.id);
    if (mode === 'container') collection.data.properties!.nativeForm = 'object';
    if (mode === 'cycle') { const edge = doc.edges.find(edge => edge.target === collection.id)!; edge.source = collection.id; edge.sourceHandle = 'result'; }
    if (mode === 'reorder') { const edges = doc.edges.filter(edge => edge.target === collection.id); const first = edges[0].targetHandle; edges[0].targetHandle = edges[1].targetHandle; edges[1].targetHandle = first; }
    if (mode === 'effects') { const call = doc.nodes.find(node => node.data.kindId === 'vvs.project.call_function')!; doc.edges = doc.edges.filter(edge => !(edge.target === call.id && edge.data?.pinType === 'execution')); }
    expect(analyzeProject(snapshot).diagnostics.some(diagnostic => diagnostic.code?.startsWith('NATIVE_')), mode).toBe(true);
  }
  const scalarExample = NATIVE_VALUE_CORPUS[0];
  const scalarPreview = await previewJavaScriptImport(scalarExample.source);
  const scalarReview = reviewSourceImportGraph(scalarPreview, scalarPreview.regions[0], 'values.js', false, 'library');
  expect(scalarReview.diagnostics).toEqual([]);
  const bad = structuredClone(scalarReview.snapshot!);
  const scalar = Object.values(bad.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'expr_native_literal')!;
  scalar.data.properties!.payload = 'process.exit()';
  expect(analyzeProject(bad).diagnostics.some(diagnostic => diagnostic.code === 'NATIVE_EXPRESSION_INVALID')).toBe(true);
  await expect(acceptSourceImportReview({ ...scalarReview, snapshot: bad }, scalarExample.source, 'values.js', false, 'library')).rejects.toThrow();
});

test('unmapped complex variants stay explicit feedback rather than lossy imports', async () => {
  for (const [language, source] of [
    ['javascript', 'function build(value) { return value?.items[0]; }'],
    ['javascript', 'function build(value) { return value && value.items; }'],
    ['javascript', 'function build(value) { return { read() { return value; } }; }'],
    ['python', 'def build(value):\n    return [item for item in value]\n'],
    ['python', 'def build(value):\n    return f"value={value}"\n'],
    ['python', 'def build(value):\n    return value[1:2, 3:4]\n'],
    ['python', 'def build():\n    return "\\N{LATIN SMALL LETTER A}"\n'],
  ] as const) {
    const preview = await (language === 'python' ? previewPythonImport : previewJavaScriptImport)(source);
    const candidate = preview.regions.find(region => region.kind === 'candidate');
    const review = candidate && reviewSourceImportGraph(preview, candidate, language === 'python' ? 'gap.py' : 'gap.js', false, 'library');
    expect(review?.snapshot, source).toBeUndefined();
    expect(Boolean(preview.diagnostics.length || preview.regions.some(region => region.kind === 'unresolved') || review?.diagnostics.length), source).toBe(true);
  }
});

for (const example of NATIVE_VALUE_CORPUS.slice(0, 2)) test(`native re-import keeps exact domains and stale review guards: ${example.id}`, async () => {
  const python = example.profile === 'python.3.11'; const fileName = python ? 'values.py' : 'values.js';
  const preview = await (python ? previewPythonImport : previewJavaScriptImport)(example.source);
  const initial = reviewSourceImportGraph(preview, preview.regions[0], fileName, false, 'library');
  expect(initial.diagnostics).toEqual([]);
  const current = await acceptSourceImportReview(initial, example.source, fileName, false, 'library');
  const source = example.source.replace('9007199254740993', '9007199254740995');
  const review = await reviewSourceReimport(current, source, fileName);
  expect(review.diagnostics).toEqual([]);
  expect(review.conflicts).toEqual([]);
  const accepted = acceptSourceReimport(review, current, source);
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!;
  expect(validateImportSnapshot(loaded, source).generated).toContain('9007199254740995');
  const changed = structuredClone(current);
  const scalar = Object.values(changed.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'expr_native_literal')!;
  scalar.data.properties!.payload = '4';
  expect(() => acceptSourceReimport(review, changed, source)).toThrow('STALE_REIMPORT');
});
