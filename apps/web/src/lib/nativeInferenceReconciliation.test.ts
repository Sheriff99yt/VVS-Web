import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, reconcileNativeScalarInferences, transactNativeScalarExpressionProperty, transactNativeScalarSignature, editNativeScalarParameterType, editNativeScalarReturnType, analyzeNativeScalarFunctionGraph } from '@vvs/graph-types';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { configureNativeInventoryRuntime } from '../../../../packages/source-import/test/nativeInventoryRuntime';
import { nativeInferenceEditFixtures, nativeInferenceGroupEdits } from '../../../../packages/source-import/test/nativeInferenceEditFixtures';
import { emitProjectLikeCodePanel } from './emitProjectCode';
configureNativeInventoryRuntime();
async function load(source: string, language: 'cpp' | 'rust' | 'gdscript') {
  const preview = await previewNativeScalarSourceGraphs(source, language, { fileName: `edits.${nativeInferenceEditFixtures[language].extension}`, entryPolicy: 'library', runtimeExpressions: true, localStatements: true, groupedDeclarations: true, inferredLocals: true });
  expect(preview.diagnostics).toEqual([]);
  return normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
}
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const fixture = nativeInferenceEditFixtures[language];
  test(`native inferred dependent signature chain ${language}`, async () => {
    const project = await load(fixture.chain, language), before = JSON.stringify(project);
    const definition = project.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
    const param = (definition.data.properties!.nativeParameters as { id: string }[])[0];
    const edited = transactNativeScalarSignature(project, definition.id, editNativeScalarParameterType(definition.data, param.id, fixture.changed));
    const partial = { ...project, ...edited, ...reconcileNativeScalarInferences({ ...project, ...edited }, definition.id) };
    expect(partial.diagnostics).toEqual([]);
    const body = partial.documents[project.functions[0].id];
    expect(body.nodes.filter(node => node.data.kindId === 'var_define').map(node => node.data.properties!.nativeType)).toEqual([fixture.changed, fixture.changed]);
    expect(body.edges.map(edge => [edge.id, edge.source, edge.target, edge.sourceHandle, edge.targetHandle])).toEqual(project.documents[project.functions[0].id].edges.map(edge => [edge.id, edge.source, edge.target, edge.sourceHandle, edge.targetHandle]));
    expect(() => analyzeNativeScalarFunctionGraph(edited.documents['main-graph'].nodes.find(node => node.id === definition.id)!.data, body, language)).toThrow();
    const updatedDefinition = partial.documents['main-graph'].nodes.find(node => node.id === definition.id)!;
    const returned = transactNativeScalarSignature(partial, definition.id, editNativeScalarReturnType(updatedDefinition.data, fixture.changed));
    const final = { ...partial, ...returned, ...reconcileNativeScalarInferences({ ...partial, ...returned }, definition.id) };
    expect(final.diagnostics).toEqual([]);
    const reloaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(final)))!;
    const output = emitProjectLikeCodePanel(reloaded);
    expect(output.files.length).toBe(1); expect(output.files[0].content).toContain(fixture.changed);
    expect(JSON.stringify(project)).toBe(before);
    const foreign = structuredClone(final); foreign.variables[0].graphTabId = 'foreign';
    const rejected = reconcileNativeScalarInferences(foreign, definition.id);
    expect(rejected.diagnostics.length).toBe(1); expect(rejected.documents).toBe(foreign.documents);
  });
  for (const kind of ['expression', 'literal'] as const) test(`native inferred ${kind} domain edit/recovery ${language}`, async () => {
    const project = await load(fixture[kind], language), before = JSON.stringify(project);
    const definition = project.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
    const expression = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => kind === 'literal' ? node.data.kindId === 'expr_native_literal' : node.data.properties?.operator === '<')!;
    const changed = { ...project, ...transactNativeScalarExpressionProperty(project, expression.id, kind === 'literal' ? 'payload' : 'operator', kind === 'literal' ? 'true' : '+') };
    expect(changed.diagnostics).toEqual([]);
    const type = kind === 'literal' ? 'bool' : fixture.integer;
    const variable = changed.variables[0];
    expect(variable.typeRef).toEqual({ kind: 'builtin', id: type === 'bool' ? 'data_boolean' : 'data_number' });
    expect(() => analyzeNativeScalarFunctionGraph(definition.data, changed.documents[project.functions[0].id], language)).toThrow();
    const returned = transactNativeScalarSignature(changed, definition.id, editNativeScalarReturnType(definition.data, type));
    const final = normalizeProjectSnapshot(JSON.parse(JSON.stringify({ ...changed, ...returned, ...reconcileNativeScalarInferences({ ...changed, ...returned }, definition.id) })))!;
    expect(emitProjectLikeCodePanel(final).files.length).toBe(1);
    expect(Object.values(final.documents).flatMap(doc => doc.nodes).find(node => node.id === expression.id)!.data.outputs[0].type).toBe(type === 'bool' ? 'data_boolean' : 'data_number');
    expect(JSON.stringify(project)).toBe(before);
    const invalid = { ...project, ...transactNativeScalarExpressionProperty(project, expression.id, kind === 'literal' ? 'payload' : 'operator', 'MissingValue') };
    expect(invalid.diagnostics.length).toBe(1);
    expect(Object.values(invalid.documents).flatMap(doc => doc.nodes).find(node => node.id === expression.id)!.data.properties![kind === 'literal' ? 'payload' : 'operator']).toBe('MissingValue');
    const recovered = { ...invalid, ...transactNativeScalarExpressionProperty(invalid, expression.id, kind === 'literal' ? 'payload' : 'operator', kind === 'literal' ? (language === 'rust' ? '1i32' : '1') : '<') };
    expect(recovered.diagnostics).toEqual([]); expect(emitProjectLikeCodePanel(recovered).files).toEqual(emitProjectLikeCodePanel(project).files);
  });
}
for (const kind of ['chain', 'mixed'] as const) test(`C++ inferred group deduction ${kind}`, async () => {
  const project = await load(nativeInferenceGroupEdits[kind], 'cpp');
  const definition = project.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
  const param = (definition.data.properties!.nativeParameters as { id: string }[])[0];
  const edited = transactNativeScalarSignature(project, definition.id, editNativeScalarReturnType(editNativeScalarParameterType(definition.data, param.id, 'bool'), 'bool'));
  const result = reconcileNativeScalarInferences({ ...project, ...edited }, definition.id);
  if (kind === 'mixed') {
    expect(result.diagnostics[0]).toContain('GROUP_DEDUCTION'); expect(result.documents).toBe(edited.documents);
    expect(edited.documents[project.functions[0].id].nodes.filter(node => node.data.kindId === 'var_define').map(node => node.data.properties!.nativeType)).toEqual(['int', 'int']);
    const literal = edited.documents[project.functions[0].id].nodes.find(node => node.data.kindId === 'expr_native_literal')!;
    const recovered = transactNativeScalarExpressionProperty({ ...project, ...edited }, literal.id, 'payload', 'true');
    expect(recovered.diagnostics).toEqual([]);
    expect(recovered.variables.every(variable => variable.typeRef?.kind === 'builtin' && variable.typeRef.id === 'data_boolean')).toBe(true);
    const reloaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify({ ...project, ...edited, ...recovered })))!;
    expect(reloaded.documents[project.functions[0].id].nodes.find(node => node.data.kindId === 'native_declaration_group')!.data.properties!.nativeType).toBe('bool');
    expect(emitProjectLikeCodePanel(reloaded).files[0].content).toContain('auto first = a, second = true');
  } else {
    expect(result.diagnostics).toEqual([]);
    expect(result.documents[project.functions[0].id].nodes.find(node => node.data.kindId === 'native_declaration_group')!.data.properties!.nativeType).toBe('bool');
    expect(emitProjectLikeCodePanel({ ...project, ...edited, ...result }).files[0].content).toContain('auto first = a, second = first');
  }
});
