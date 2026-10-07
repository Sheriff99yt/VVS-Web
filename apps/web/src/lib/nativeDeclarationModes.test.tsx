import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeProjectSnapshot, transactNativeScalarDeclarationMode, transactNativeScalarLocal, analyzeNativeScalarFunctionGraph, inspectNativeScalarFunctionFlow } from '@vvs/graph-types';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { configureNativeInventoryRuntime } from '../../../../packages/source-import/test/nativeInventoryRuntime';
import cases from '../../../../packages/source-import/test/native-local-source-cases.json';
import { NativeLocalPanel } from '../components/layout/RightSidebar/NativeLocalPanel';
import { NativeDeclarationGroupPanel } from '../components/layout/RightSidebar/NativeDeclarationGroupPanel';
import { emitProjectLikeCodePanel } from './emitProjectCode';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`typed local mode ownership/recovery ${language}`, async () => {
  const preview = await previewNativeScalarSourceGraphs(cases[language][0].source, language, { fileName: `mode.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, entryPolicy: 'library', localStatements: true });
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const declaration = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'result')!;
  const original = emitProjectLikeCodePanel(project);
  const before = JSON.stringify(project);
  const next = { ...project, ...transactNativeScalarDeclarationMode(project, declaration.id, { declarationMode: 'inferred' }) };
  const doc = next.documents[next.variables.find(variable => variable.id === declaration.data.properties!.symbolId)!.graphTabId!];
  const edited = doc.nodes.find(node => node.id === declaration.id)!;
  expect(edited.data.properties!.nativeInferenceMode).toBeDefined();
  expect(emitProjectLikeCodePanel(next).files).not.toEqual(original.files);
  const html = renderToStaticMarkup(<NativeLocalPanel data={edited.data} onChange={() => {}} />);
  expect(html).toContain('Native local mode'); expect(html).toContain('Inferred local type'); expect(html).not.toContain('aria-label="Native local type"');
  const recovered = { ...next, ...transactNativeScalarDeclarationMode(next, declaration.id, { declarationMode: 'typed' }) };
  expect(emitProjectLikeCodePanel(recovered).files).toEqual(original.files);
  expect(recovered.documents).toEqual(project.documents);
  expect(JSON.stringify(project)).toBe(before);
  const wrongIndex = structuredClone(project); wrongIndex.variables.find(variable => variable.id === declaration.data.properties!.symbolId)!.graphTabId = 'foreign';
  expect(() => transactNativeScalarDeclarationMode(wrongIndex, declaration.id, { declarationMode: 'inferred' })).toThrow();
});
test('C++ child mode switches coordinate the whole declaration group', async () => {
  const preview = await previewNativeScalarSourceGraphs(cases.cpp[1].source, 'cpp', { fileName: 'grouped.cpp', entryPolicy: 'library', localStatements: true, groupedDeclarations: true });
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const group = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'native_declaration_group')!;
  const child = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.groupOwnerId === group.id)!;
  const next = { ...project, ...transactNativeScalarDeclarationMode(project, child.id, { declarationMode: 'inferred' }) };
  expect(emitProjectLikeCodePanel(next).files[0].content).toContain('auto first = a, second =');
  const owner = Object.values(next.documents).flatMap(doc => doc.nodes).find(node => node.id === group.id)!;
  const html = renderToStaticMarkup(<NativeDeclarationGroupPanel data={owner.data} onChange={() => {}} />);
  expect(html).toContain('Native group mode'); expect(html).toContain('Inferred group type'); expect(html).not.toContain('aria-label="Native group type"');
  const typed = { ...next, ...transactNativeScalarDeclarationMode(next, group.id, { declarationMode: 'typed' }) };
  expect(emitProjectLikeCodePanel(typed).files).toEqual(emitProjectLikeCodePanel(project).files);
});
test('Rust typed unsuffixed initializer cannot become a fabricated inferred narrow type', async () => {
  const source = 'fn probe(a: i8) -> i8 { let first: i8 = 1; first }\n';
  const preview = await previewNativeScalarSourceGraphs(source, 'rust', { fileName: 'probe.rs', entryPolicy: 'library', localStatements: true });
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const declaration = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define')!;
  const before = JSON.stringify(project);
  expect(() => transactNativeScalarDeclarationMode(project, declaration.id, { declarationMode: 'inferred' })).toThrow('INFERENCE_CONSTRAINTS_REQUIRED');
  expect(JSON.stringify(project)).toBe(before);
});

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`mode editing preserves unrelated invalid body semantics ${language}`, async () => {
  const preview = await previewNativeScalarSourceGraphs(cases[language][0].source, language, { fileName: `recovery.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, entryPolicy: 'library', localStatements: true });
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const declaration = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'result')!;
  const owner = declaration.data.properties!.nativeOwnerId;
  const definition = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === owner)!;
  const tabId = project.variables.find(variable => variable.id === declaration.data.properties!.symbolId)!.graphTabId!;
  // GDScript forbids inferred constants; use an invalid earlier constant
  // initializer instead, leaving the selected declaration mutable.
  const invalidDeclaration = language === 'gdscript'
    ? project.documents[tabId].nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'first')!
    : declaration;
  const invalid = { ...project, ...transactNativeScalarLocal(project, invalidDeclaration.id, { mutable: false }) };
  const before = JSON.stringify(invalid);
  expect(() => analyzeNativeScalarFunctionGraph(definition.data, invalid.documents[tabId], language)).toThrow();
  const flow = inspectNativeScalarFunctionFlow(definition.data, invalid.documents[tabId], language);
  expect(flow.valueType).toBeUndefined();
  expect(flow.locals!.map(local => local.declarationId)).toContain(declaration.id);
  const switched = { ...invalid, ...transactNativeScalarDeclarationMode(invalid, declaration.id, { declarationMode: 'inferred' }) };
  expect(switched.documents[tabId].edges).toEqual(invalid.documents[tabId].edges);
  expect(() => analyzeNativeScalarFunctionGraph(definition.data, switched.documents[tabId], language)).toThrow();
  const reloaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(switched)))!;
  const recovered = { ...reloaded, ...transactNativeScalarLocal(reloaded, invalidDeclaration.id, { mutable: true }) };
  expect(() => analyzeNativeScalarFunctionGraph(definition.data, recovered.documents[tabId], language)).not.toThrow();
  expect(emitProjectLikeCodePanel(recovered).files.length).toBeGreaterThan(0);
  expect(JSON.stringify(invalid)).toBe(before);
  const malformed = structuredClone(invalid);
  const edge = malformed.documents[tabId].edges.find(edge => edge.data?.pinType === 'execution')!;
  edge.target = edge.source;
  expect(() => transactNativeScalarDeclarationMode(malformed, declaration.id, { declarationMode: 'inferred' })).toThrow();
});

test('editing never uses a stale preceding inferred mirror as a deduction hint', async () => {
  const preview = await previewNativeScalarSourceGraphs(cases.cpp[0].source, 'cpp', { fileName: 'stale.cpp', entryPolicy: 'library', localStatements: true });
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const declaration = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'result')!;
  const tabId = project.variables.find(variable => variable.id === declaration.data.properties!.symbolId)!.graphTabId!;
  const first = project.documents[tabId].nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'first')!;
  const inferred = { ...project, ...transactNativeScalarDeclarationMode(project, first.id, { declarationMode: 'inferred' }) };
  // All numeric ports remain unchanged, but the earlier cached native width
  // disagrees with its actual int parameter initializer.
  inferred.documents[tabId].nodes.find(node => node.id === first.id)!.data.properties!.nativeType = 'long';
  const before = JSON.stringify(inferred);
  expect(() => transactNativeScalarDeclarationMode(inferred, declaration.id, { declarationMode: 'inferred' })).toThrow('INFERENCE_TYPE_CONSTRAINTS_REQUIRED');
  expect(JSON.stringify(inferred)).toBe(before);
});
