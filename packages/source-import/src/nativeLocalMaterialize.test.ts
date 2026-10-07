import { expect, test } from 'bun:test';
import { analyzeNativeScalarFunctionGraph, type GraphDocument, type ProjectSnapshot } from '@vvs/graph-types';
import { previewNativeScalarSourceGraphs } from './nativeScalarSourceGraphs';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import cases from '../test/native-local-source-cases.json';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`local source materialization and saved body mutations ${language}`, async () => {
  const source = cases[language][0].source, options = { fileName: `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, entryPolicy: 'library' as const };
  expect((await previewNativeScalarSourceGraphs(source, language, { ...options, runtimeExpressions: true })).snapshot).toBeUndefined();
  const preview = await previewNativeScalarSourceGraphs(source, language, { ...options, localStatements: true });
  expect(preview.diagnostics).toEqual([]); expect(preview.graphAdmission).toBe('blocked');
  const project = JSON.parse(JSON.stringify(preview.snapshot)) as ProjectSnapshot;
  expect(project.variables).toHaveLength(5); expect(project.functions).toHaveLength(3);
  for (const fn of project.functions) {
    const definition = project.documents['main-graph'].nodes.find(node => node.data.graphBinding?.symbolId === fn.id)!.data;
    const doc = project.documents[fn.id];
    const analysis = analyzeNativeScalarFunctionGraph(definition, doc, language);
    expect(analysis.locals!.length).toBeGreaterThan(0); expect(analysis.valueType).toBe(definition.properties!.nativeReturnType);
    for (const node of doc.nodes) {
      const at = node.data.properties!.sourceOrigin as { start: number; end: number; sourceSha256: string };
      expect(at.sourceSha256).toBe(preview.sourceSha256);
      expect(source.slice(at.start, at.end)).not.toBe('');
    }
    const mutate = (change: (doc: GraphDocument) => void) => {
      const changed = structuredClone(doc); change(changed);
      expect(() => analyzeNativeScalarFunctionGraph(definition, changed, language)).toThrow();
    };
    mutate(doc => { const properties = doc.nodes.find(node => node.data.kindId === 'var_define')!.data.properties!; properties.nativeAuthoredType = properties.nativeType === 'bool' ? (language === 'rust' ? 'i32' : 'int') : 'bool'; });
    mutate(doc => { doc.nodes.find(node => node.data.kindId === 'variable_get')!.data.graphBinding!.symbolId = 'missing'; });
    mutate(doc => { doc.nodes.find(node => node.data.kindId === 'variable_get')!.data.properties!.nativeType = 'bool'; });
    mutate(doc => { doc.edges.find(edge => edge.data?.pinType === 'execution')!.sourceHandle = 'parameter-0'; });
    mutate(doc => { doc.nodes.find(node => node.data.kindId === 'var_define')!.data.inlineValues.value = 1; });
    mutate(doc => { doc.edges.push({ ...doc.edges[0], id: 'duplicate-edge' }); });
  }
  const fn = project.functions.find(fn => fn.name === 'accumulate')!, doc = project.documents[fn.id];
  const definition = project.documents['main-graph'].nodes.find(node => node.data.graphBinding?.symbolId === fn.id)!.data;
  const changed = structuredClone(doc), assign = changed.nodes.find(node => node.data.kindId === 'variable_set')!;
  const declared = changed.nodes.find(node => node.data.properties?.symbolId === assign.data.graphBinding?.symbolId && node.data.kindId === 'var_define')!;
  declared.data.properties!.nativeMutable = false; declared.data.properties!.isConst = true;
  expect(() => analyzeNativeScalarFunctionGraph(definition, changed, language)).toThrow(language === 'gdscript' ? 'CONSTANT_BINDING_CONTEXT' : 'ASSIGNMENT_OWNER');
});
test('C++ grouped locals remain atomic until their visible group/IR mapping exists', async () => {
  const preview = await previewNativeScalarSourceGraphs(cases.cpp[1].source, 'cpp', { fileName: 'grouped.cpp', entryPolicy: 'library', localStatements: true });
  expect(preview.snapshot).toBeUndefined(); expect(preview.diagnostics[0].code).toContain('DECLARATION_GROUP_MAPPING_REQUIRED');
});
