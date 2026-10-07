import { expect, test } from 'bun:test';
import { IMPORT_EXPANSION_CORPUS } from '../../../../packages/source-import/src/expansionCorpus';
import { previewJavaScriptImport, previewPythonImport } from '@vvs/source-import';
import { reviewSourceImportGraph, normalizedImportSyntax } from '@vvs/source-import/validation';
import { normalizedPythonSyntax } from '@vvs/source-import';
import { emitProjectLikeCodePanel } from './emitProjectCode';

for (const example of IMPORT_EXPANSION_CORPUS.filter(example => example.expected === 'supported')) test(`Code panel preserves expanded import: ${example.id}`, async () => {
  const preview = await (example.language === 'python' ? previewPythonImport : previewJavaScriptImport)(example.source);
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, `${example.id}.txt`, false, 'library');
  expect(review.diagnostics).toEqual([]);
  const output = emitProjectLikeCodePanel(review.snapshot!);
  const normalize = example.language === 'python' ? normalizedPythonSyntax : normalizedImportSyntax;
  expect(output.files).toHaveLength(1);
  expect(normalize(output.files[0].content)).toBe(normalize(example.source));
  for (const doc of Object.values(review.snapshot!.documents)) for (const node of doc.nodes) {
    if (node.data.kindId === 'function_define' || node.data.kindId === 'function_entry') continue;
    expect(output.sourceMap[node.id]?.length, `${example.id}/${node.data.kindId}`).toBeGreaterThan(0);
  }
});

// Native contract probes use the same emitter as the visible Code panel.
import { NATIVE_VALUE_CORPUS } from '../../../../packages/source-import/src/nativeValueCorpus';
for (const example of NATIVE_VALUE_CORPUS) test(`Code panel native values: ${example.id}`, async () => {
  const python = example.profile === 'python.3.11';
  const preview = await (python ? previewPythonImport : previewJavaScriptImport)(example.source);
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, `${example.id}.${python ? 'py' : 'js'}`, false, 'library');
  expect(review.diagnostics).toEqual([]);
  const loaded = JSON.parse(JSON.stringify(review.snapshot!));
  const output = emitProjectLikeCodePanel(loaded);
  const normalize = python ? normalizedPythonSyntax : normalizedImportSyntax;
  expect(output.files).toHaveLength(1);
  expect(normalize(output.files[0].content)).toBe(normalize(example.source));
  for (const doc of Object.values(review.snapshot!.documents)) for (const node of doc.nodes.filter(node => node.data.kindId?.startsWith('expr_native_'))) expect(output.sourceMap[node.id]?.length, `${example.id}/${node.data.kindId}`).toBeGreaterThan(0);
});

test('Code panel never repairs malformed native graph edits into generated source', async () => {
  const example = NATIVE_VALUE_CORPUS[0];
  const preview = await previewJavaScriptImport(example.source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'values.js', false, 'library');
  expect(review.diagnostics).toEqual([]);
  for (const mode of ['payload', 'ports', 'target', 'cycle']) {
    const snapshot = structuredClone(review.snapshot!);
    const doc = Object.values(snapshot.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'expr_native_collection'))!;
    const scalar = doc.nodes.find(node => node.data.kindId === 'expr_native_literal')!;
    const array = doc.nodes.find(node => node.data.kindId === 'expr_native_collection')!;
    if (mode === 'payload') scalar.data.properties!.payload = 'arbitrary()';
    if (mode === 'ports') array.data.inputs.pop();
    if (mode === 'target') { snapshot.targetLanguage = 'rust'; for (const document of Object.values(snapshot.documents)) document.metadata = { ...document.metadata, targetLanguage: 'rust' }; }
    if (mode === 'cycle') { const edge = doc.edges.find(edge => edge.target === array.id)!; edge.source = array.id; edge.sourceHandle = 'result'; }
    expect(() => emitProjectLikeCodePanel(snapshot), mode).toThrow('NATIVE_');
  }
});

for (const example of [
  { language: 'javascript', source: 'function defaults(value = [1, 2]) { return value; } function use() { return defaults(); }' },
  { language: 'javascript', source: 'function collect(...values) { return values; } function use() { return collect(1, 2, 3); }' },
  { language: 'python', source: 'def collect(first=1, *rest):\n    return [first, rest]\ndef use():\n    return collect(2, 3, 4)\n' },
  { language: 'python', source: 'def choose(first, second=2):\n    return [first, second]\ndef use():\n    return choose(second=3, first=1)\n' },
  { language: 'python', source: 'def choose(flag):\n    if flag == True:\n        result = 1\n    else:\n        result = 2\n    return result\n' },
]) test(`Code panel callable foundations: ${example.source.split('\n')[0]}`, async () => {
  const preview = await (example.language === 'python' ? previewPythonImport : previewJavaScriptImport)(example.source);
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'callable.txt', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const output = emitProjectLikeCodePanel(JSON.parse(JSON.stringify(review.snapshot)));
  const normalize = example.language === 'python' ? normalizedPythonSyntax : normalizedImportSyntax;
  expect(normalize(output.files[0].content)).toBe(normalize(example.source));
  for (const node of Object.values(review.snapshot!.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId?.startsWith('expr_native_'))) expect(output.sourceMap[node.id]?.length).toBeGreaterThan(0);
});

import callableFixture from '../../../../packages/source-import/test/native-callable.fixture.json';
import { normalizeProjectSnapshot, nativeSignature, withNativeParameters, applyFunctionImplementBinding } from '@vvs/graph-types';
test('fixed callable graph emits through Code panel after signature and default edits', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(callableFixture.snapshot))!;
  const baseline = emitProjectLikeCodePanel(snapshot);
  expect(normalizedPythonSyntax(baseline.files[0].content)).toBe(normalizedPythonSyntax(callableFixture.source));
  const definition = Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => nativeSignature(node.data)?.some(parameter => parameter.defaultPin))!;
  const fn = snapshot.functions.find(fn => fn.id === definition.data.graphBinding?.symbolId)!;
  definition.data.inlineValues!['default-python-parameter-0'] = 9;
  definition.data = withNativeParameters(definition.data, nativeSignature(definition.data)!);
  definition.data = applyFunctionImplementBinding(definition.data, fn);
  expect(definition.data.inputs.find(pin => pin.id.startsWith('default-'))?.type).toBe('data_number');
  const output = emitProjectLikeCodePanel(JSON.parse(JSON.stringify(snapshot)));
  expect(output.files[0].content).toContain('first = 9');
  expect(output.files[0].content).toContain('collect(first=5)');
  expect(output.sourceMap[definition.id]?.length).toBeGreaterThan(0);
});
